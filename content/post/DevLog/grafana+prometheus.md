+++
title = 'Grafana로 DB 성능 모니터링'
date = 2025-07-24T14:17:38+09:00
draft = true
categories = ["DevLog"]
+++

예전 프로젝트에서 DB의 데이터들을 모니터링하는 대시보드는 제작해봤었지만, DB 성능을 모니터링 대시보는 제작한 경험이 없어 이 참에 한번 도전해봤다.   

## 환경
- OS : Windows 11 HOME (WSL 설치)

## 시스템 구성도
> MySQL ➡️ MySQL Exporter ➡️ Prometheus ➡️ Grafana  

| 구성요소           | 역할                                        |
| -------------- | ----------------------------------------- |
| **MySQL**      | 실제 데이터베이스                                 |
| **Exporter**   | MySQL에서 성능 정보 추출 + HTTP 형식으로 노출           |
| **Prometheus** | Exporter로부터 데이터를 주기적으로 수집 + 저장            |
| **Grafana**    | Prometheus에서 데이터를 읽어와서 시각화 (Dashboard 형태) |


그라파나로 MySQL의 성능을 모니터링하려면 `MySQL Exporter` 를 사용해 메트릭을 수집한 다음,  
`Prometheus`로 저장한 뒤, 이를 `Grafana` 대시보드로 시각화하는 방식이 일반적이다. 


MySQL은 자체적으로 성능을 확인할 수 있도록 `show status` 나 `information_schema` 를 제공하지만, 외부 모니터링 시스템이 직접 접근해서 수집하기 어렵다.  
따라서 MySQL에서 쿼리를 실행 후 메트릭 데이터를 HTTP로 노출해주는 exporter 를 사용한다.  
프로메테우스는 이 HTTP 엔드포인트(`localhost:9104/metrics`)에 정기적으로 접근해서 데이터를 수집하는 기능을 한다.  

## 환경 세팅
### 1. MySQL Exporter` 설치 및 설정
Exporter의 경우 Windows 사용자는 WSL, Docker, Go 세 가지 환경 중 하나를 골라서 Exporter를 설치하면 된다. 나는 이전에 설치해둔 WSL에 Exporter를 설치했다.  (대부분 Docker를 쓰는듯 하다.)  

아래의 명령어로 간편하게 설치 및 압축해제 할 수 있다.  

```bash
# 다운로드
wget https://github.com/prometheus/mysqld_exporter/releases/download/v0.15.1/mysqld_exporter-0.15.1.linux-amd64.tar.gz
tar -xzf mysqld_exporter-*.tar.gz
cd mysqld_exporter-*
```
### 2. MySQL 계정생성
MySQL에서 exporter 계정을 생성해주어야 한다. 
```sql
CREATE USER 'exporter'@'%' IDENTIFIED BY 'yourpassword';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
```
`exporter`와 `yourpassword`에 개인 정보를 입력한 후 한 줄씩 실행하면 된다. 

### 3. WSL 에서 `.my.cnf` 파일 설정
exporter 이름과 비밀번호는 개인설정 값으로 바꿔주면 된다.  
```bash
echo -e "[client]\nuser=exporter\npassword=yourpassword" > ~/.my.cnf
```
해당 파일의 경우 `ls -a ~` 로 존재 여부를 확인할 수 있다.  

그리고, 해당 cnf파일에 권한설정을 해준다. 
```bash
chmod 600 ~/.my.cnf
```

그 다음 실행 해주면 ,
```bash 
./mysqld_exporter --config.my-cnf=~/.my.cnf --web.listen-address="0.0.0.0:9104"
```
