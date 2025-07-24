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

| 항목| 설명|
| ------ | ----- |
| 주요 기술  | MariaDB/PostgreSQL, Python, Shell, SQL, ERDCloud(DB 모델링), Grafana or Prometheus(모니터링), Linux(Ubuntu VM) |
| 목표| 주식 주문 처리/조회 시스템의 데이터베이스를 직접 설계하고 운영환경을 구성, 자동화, 성능 분석 |
| 형태&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 개인 프로젝트 (가능하면 GitHub 공개 및 블로그 정리 병행)  |

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

증권거래 시스템에서 필요할 것으로 생각되는 정보들을 취합하여 스키마를 제작했다.  
<p align="center">
  <a href="/images/projects/stock_db/ERD.png" data-lightbox="image-set">
    <img src="/images/projects/stock_db/ERD.png" alt="Your Alt Text" >
  </a>
</p>

주요 설명을 하자면,  
하나의 `user_id` 는 여러 개의 `accounts` 를 가질 수 있다. (1:N)  
한 계좌는 여러 개의 `orders`(주문)를 생성할 수 있다. (1:N)  
한 계좌는 여러 개의 `positions`(보유 종목)를 가질 수 있다. (1:N)  
`user_id` 는 `users` 와 (N:1)로 연결된다.  

