+++
title = 'Grafana로 DB 성능 모니터링'
date = 2025-07-24T14:17:38+09:00
draft = false
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


## MySQL Exporter 설치 및 설정
Exporter의 경우 Windows 사용자는 WSL, Docker, Go 세 가지 환경 중 하나를 골라서 Exporter를 설치하면 된다. 나는 이전에 설치해둔 WSL에 Exporter를 설치했다.  (대부분 Docker를 쓰는듯 하다.)  

아래의 명령어로 간편하게 설치 및 압축해제 할 수 있다.  

```bash
# 다운로드
wget https://github.com/prometheus/mysqld_exporter/releases/download/v0.15.1/mysqld_exporter-0.15.1.linux-amd64.tar.gz
tar -xzf mysqld_exporter-*.tar.gz
cd mysqld_exporter-*
```
이 프로그램을 실행하면 하나의 HTTP 서버처럼 동작하게 된다. 

## MySQL 계정생성
MySQL에서 exporter 계정을 생성해주어야 한다. 
```sql
CREATE USER 'exporter'@'%' IDENTIFIED BY 'yourpassword';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
```
`exporter`와 `yourpassword`에 개인 정보를 입력한 후 한 줄씩 실행하면 된다. 

현재 나의 환경은 MySQL 서버가 Windows에 설치되어 있기 때문에 한 가지를 더 수정해야 한다.  
C:\ProgramData\MySQL\MySQL Server 8.0\my.ini   경로에서 [mysqld] 부분을 찾아 bind-address를 추가한다.(모든 ip 접근 허용)
```txt
[mysqld]
bind-address=0.0.0.0
```

또한 3306의 포트를 열기 위해 powershell을 관리자 권한으로 실행하여 아래 명령어를 입력한다.
```shell
New-NetFirewallRule -DisplayName "Allow MySQL" -Direction Inbound -Protocol TCP -LocalPort 3306 -Action Allow
```
(윈도우 방화벽 설정가서 해도됨)


## WSL 에서 `.my.cnf` 파일 설정
mysql_exporter가 MySQL에 접속하기 위해서는 사용자 계정이 필요하고, ReadOnly 권한만 있으면 된다. (SELECT, PROCESS, REPLICATION CLIENT)
> exporter 계정은 모니터링 목적이므로 `INSERT`, `DELETE`, `DROP` 등의 권한은 절대 주지 않는다. 

가장 먼저 .my.cnf 파일을 생성한다.   
이 파일은 MySQL 클라이언트 설정 파일이며, Exporter 가 MySQL에 자동 로그인할 수 있도록 사용자 계정 정보를 저장하고 있다.   
즉, mysql_exporter는 이 파일을 읽고 MySQL에 로그인할 때, `-u exporter -p`  입력없이 자동으로 인증되게 해준다. 

파일 내용은 아래와 같으며 exporter 이름과 비밀번호는 개인설정 값으로 바꿔주면 된다.  
```bash
echo -e "[client]\nuser=exporter\npassword=yourpassword" > ~/.my.cnf
```
하지만 나의 경우 이렇게만 하면 연결이 안된다. 
```txt
[client]
user=exporter
password=yourpassword
host=IPv4주소 
port=3306
```
이렇게 IP 주소와 Port 정보까지 입력하니 연결이 됐다.

해당 파일의 경우 `ls -a` 로 존재 여부를 확인할 수 있다.  

그리고, 반드시 접근 권한을 제한해야 한다. 권한이 열려 있으면 exporter 실행 시 보안 오류가 발생하거나, MySQL접속이 거부 될 수 있다. 
```bash
chmod 600 ~/.my.cnf
```

그 다음 실행 해주면 ,
```bash 
./mysqld_exporter --config.my-cnf=~/.my.cnf --web.listen-address="0.0.0.0:9104"

./mysqld_exporter --config.my-cnf=/home/your-username/.my.cnf --web.listen-address="0.0.0.0:9104"
```
상대경로 or 절대경로

## Prometheus 설정

[https://prometheus.io/download](https://prometheus.io/download)  
위 링크에서 OS에 맞는 프로메테우스를 다운받은 후 압축을 해제한다. 

`prometheus.yml` 에서 주요 설정을 변경한다. 
```yaml
global:
  scrape_interval: 15s  # 메트릭 수집 주기

scrape_configs:
  - job_name: 'mysql'
    static_configs:
      - targets: ['localhost:9104']  # Exporter가 WSL에서 실행 중일 경우, IP 변경 가능
```

그 다음 ,
```bash
prometheus.exe --config.file=prometheus.yml
```
으로 프로메테우스를 실행한 후 `http://localhost:9090` 으로 접속하여 확인한다. 

<p align="center">
  <a href="/images/DevLog/prometheus.png" data-lightbox="image-set">
    <img src="/images/DevLog/prometheus.png" alt="Your Alt Text" >
  </a>
</p>

이렇게 mysql이 up 상태이면 설정 완료. 

## Grafana 설정
[https://grafana.com/grafana/download](https://grafana.com/grafana/download)  
여기서 본인 컴터에 맞는 그라파나를 다운로드 한다. 

설치 완료 후 `http://localhost:3000` 으로 접속한다. 초기 계정 정보는 admin-admin 이며 이후 변경하는 것을 권장한다. 

`Add Data Source` 탭에서 Prometheus를 클릭한 후 URL 정보를 `http://localhost:9090` 으로 입력 해준다. 
Save&Test가 정상적으로 작동된다면, 연결 완료. 

대시보드의 경우 그라파나에서 자체 템플릿을 제공하는데, 
Dashboards > + Import > ID : 7362 입력 > Load > Import 
순으로 실행하면 된다. 

<p align="center">
  <a href="/images/DevLog/prometheus_grafana.png" data-lightbox="image-set">
    <img src="/images/DevLog/prometheus_grafana.png" alt="Your Alt Text" >
  </a>
</p>

아직은 DB를 사용하지 않아 아무 데이터가 없다. 


## 최종 정리 
전체 구성을 표로 정리해봤다. (내 컴터 기준)
| 구성 요소                | 역할                      | 설정 위치      |
| -------------------- | ----------------------- | ---------- |
| **MySQL**            | 실제 DB                   | Windows    |
| **mysqld\_exporter** | MySQL 메트릭 수집 → HTTP로 노출 | WSL        |
| **Prometheus**       | Exporter에서 메트릭 수집 및 저장  | Windows    |
| **Grafana**          | Prometheus에서 메트릭 시각화    | Windows    |
| **.my.cnf**          | exporter 인증 정보          | WSL 홈 디렉토리 |

실행 순서는 
> mysql_exporter(WSL 환경) 실행하여 HTTP 서버 띄우기 > prometheus 실행 > grafana 접속   

이렇게 하면 된당. 

그리고 이건 추가 정보 
| 상황                                 | 조치                                                    |
| ---------------------------------- | ----------------------------------------------------- |
| WSL에서 exporter 실행 시 Windows 접근 안 됨 | WSL IP 확인 후 prometheus.yml에 명시                        |
| Prometheus에서 exporter가 `DOWN`일 경우  | 포트 열림 여부 확인 (`curl <ip>:9104`), WSL 방화벽 설정 확인         |
| 보안상 exporter 사용자 제한 필요             | MySQL에서 `SELECT`, `PROCESS`, `REPLICATION CLIENT`만 부여 |
| Grafana에 알림 추가                     | 특정 지표(Slow query 등)에 alert 설정 가능                      |
