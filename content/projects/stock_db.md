+++
title = '증권 거래 시스템 DB 설계 및 운영(1)'
date = 2025-07-24T14:17:38+09:00
draft = true
categories = ["projcets"]
+++

토이 프로젝트입니다. 

## 기획 배경 및 목적
- DB 운영팀 실무에 직접 연관되는 데이터베이스 구축, 설계, 운영 자동화, 성능 모니터링 등의 경험을 빠르게 축적.
- 금융권 DB 운영 환경에서의 핵심 이슈(안정성, 보안, 실시간성, 장애 대응 등)를 체험할 수 있도록 설계.
- DBA 직무에서 우대하는 요소들(모델링, 튜닝, 백업, 모니터링, 스크립트 등)을 프로젝트 안에 통합.

|항목&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | 설명|
| -------- | ----- |
|   주요 기술 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|MariaDB/PostgreSQL, Python, Shell, SQL, ERDCloud(DB 모델링), Grafana or Prometheus(모니터링), Linux(Ubuntu VM)|
|   목표&nbsp;&nbsp;&nbsp;&nbsp;         |주식 주문 처리/조회 시스템의 데이터베이스를 직접 설계하고 운영환경을 구성, 자동화, 성능 분석|
|   형태&nbsp;&nbsp;&nbsp;&nbsp;         |개인 프로젝트 (가능하면 GitHub 공개 및 블로그 정리 병행) |

## 기능 구성
1. 기초 설계 및 구축
    거래 관련 테이블(계좌, 종목, 주문, 체결, 잔고 등) ERD 설계  
    PostgreSQL 또는 MariaDB에 테이블 생성 및 제약조건 설정  
    테스트 데이터 자동 삽입 스크립트(Python or Shell)

2. 운영 자동화
    Shell 스크립트 또는 Python으로 다음 작업 자동화:
    매일 새벽 백업 및 로그 저장  
    에러 발생 시 알림 로그 작성
    성능 상태 점검(커넥션 수, slow query 등)

3. 성능 분석 및 튜닝
    쿼리 로그 분석을 통한 SQL 튜닝   
    DB 파라미터 조정 예시 제시 (예: innodb_buffer_pool_size)   
    인덱스 적용 전후 속도 비교

4. 모니터링
    Grafana + Prometheus 또는 MySQL Workbench Performance Dashboard로:  
    DB CPU, 커넥션 수, 쿼리 응답시간, 에러 등 시각화

5. 장애 시나리오 및 복구
    의도적으로 서비스 장애 발생 (쿼리 폭주, 디스크 용량 초과 등)  
    복구 절차 수행: 백업 복원, slow query kill, 트랜잭션 롤백

## DB 설계 

증권거래 시스템에서 필요할 것으로 생각되는 정보들을 취합한 ERD 
<p align="center">
  <a href="/images/projects/stock_db/erd.png" data-lightbox="image-set">
    <img src="/images/projects/stock_db/erd.png" alt="Your Alt Text" >
  </a>
</p>

| 요소                     | 의미                             |
| ---------------------- | ------------------------------ |
| `users ↔ accounts`     | 한 명의 고객이 여러 개의 계좌를 가질 수 있음     |
| `accounts ↔ orders`    | 계좌 단위로 매수/매도 주문 발생             |
| `orders ↔ trades`      | 주문이 체결되면 하나 이상의 체결 내역으로 연결됨    |
| `accounts ↔ positions` | 계좌가 보유 중인 종목과 수량을 기록함          |
| `stocks`               | 주문, 체결, 포지션에서 공통적으로 참조하는 주식 종목 |
| `stocks ↔ stocks_inventory` | 주문 체결에 따른 종목의 잔여수량 |


위와 같이 논리적 모델링을 해봤다.  
물론 실제 시스템은 훨씬 크고 복잡한 구조를 가졌을 테지만, 내가 생각했을 때 가장 필요한 개체와 속성들을 위주로 간단하게 만들었다. 

## Dummy 데이터 생성
현재는 아무 데이터가 없는 상태이니 임의로 데이터를 넣어주도록 하겠다.  
users, accounts, stocks 테이블의 데이터는 사전에 만들어진 상태로, 매매 주문 체결 과정만 transaction으로 구현해보려 한다. 
``` python

#2025년 1월1일 기준 KOSPI 상장 종목
tock_lst = stock.get_market_ticker_list('20250101','KOSPI')
stock_name = list(map(stock.get_market_ticker_name, stock_lst))

def load_config(file_name):
    with open(file_name,'r') as f:
        return json.load(f)

conn = pymysql.connect(**load_config(config))

fake = Faker('ko_KR')
cursor = conn.cursor()
# 사용자 50명 생성
for i in range(1, 50+1):
    user_id = i
    name = fake.name()
    email = fake.email()
    cursor.execute("INSERT INTO users (user_id, name, email, created_at) VALUES (%s, %s, %s, NOW())", (user_id, name, email))

# 계좌 100개 생성 (1~50 유저 랜덤 연결)
for i in range(1, 100+1):
    user_id = random.randint(1, 50)
    acc_no = f"ACC-{1000+i}"
    balance = random.randint(1000000, 10000000)
    cursor.execute("INSERT INTO accounts (account_id, user_id, account_number, balance, created_at) VALUES (%s,%s, %s, %s, NOW())", (i, user_id, acc_no, balance))

# KOSPI 961 종목 
for i, (tick, name) in enumerate(zip(stock_lst, stock_name)):
    cursor.execute("INSERT INTO stocks (stock_id, symbol, name, market) VALUES (%s, %s, %s, 'KOSPI')", (i,tick, name))

conn.close()
```
