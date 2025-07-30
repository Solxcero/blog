+++
title = 'CallBack'
date = 2024-11-09T00:17:43+09:00
draft = false
categories = ["DevLog"]
+++

흐어 요새 연구과제 때매 정신이 없다...
퇴근하면 방전된 상태로 집에 온다 ㅠㅠ 빨리 끝내버리고 싶다 흐규 넘 힘들어 ㅠ

## CallBack 이 필요했던 이유
현재 개발하고 있는 시스템의 구성을 간략히 말하면,  
외부 서버와 통신하는 Socket 인터페이스와 DB 인터페이스가 있다.  
DB 인터페이스의 경우 실시간으로 1분 마다 데이터를 조회 후 연산 결과를 다시 DB에 저장한다.   
Socket 인터페이스는 1초 마다 요청을 보내고 상대 서버에서 메세지가 날라오면 해당 메세지를 처리하여 별도의 연산 프로세스를 수행한 후 결과를 DB에 저장함과 동시에 다시 상대 서버에 메세지를 보낸다. 

내 역할은 API 와 Socket을 통한 통신, DB 연계, 그리고 연산 모듈을 개발하는 것이다. 

아주 대충 시스템 구성을 그려보자면, 

<p align="center">
  <a href="/images/DevLog/callback(1).png" data-lightbox="image-set">
    <img src="/images/DevLog/callback(1).png" alt="Your Alt Text" width="400" >
  </a>
</p>

요런 느낌. 

암튼 그래서 내가 콜백함수를 쓴 이유는 

1. 비동기 작업 처리   
API 메세지를 받고 추가 연산을 거쳐 다시 DB에 저장하고 API로 송신하는 작업은 다른 작업(1분 마다 조회하고 계산하여 저장)의 완료 여부와 관계 없이 독립적으로 실행되어야 한다. 

2. 모듈간 의존성 최소화  
PulvPhysic, BoilerPhysic 클래스는 input 데이터를 받아와 복잡한 연산을 거친 후 출구 온도를 return 하는 구조로 되어있다. 이게 이 클래스들의 역할이다. 
input 데이터 받아오기, output 데이터 저장하기, 외부 서버로 데이터 송신하기 등은 클래스 내부에서 처리되어야 한다.   
이렇게 모듈을 구성해두면 유지보수 및 테스트에  매우 용이하지 않은가~

> 콜백함수란?  
특정 이벤트가 발생하거나 작업이 완료된 후 호출되는 함수  
보통 함수의 인자로 전달되어, 특정 조건에서 실행되도록 설계

## 프로젝트에서 콜백쓰기 
이번 프로젝트에서는 연산 클래스에 콜백 함수를 전달하여, 계산 결과나 상태 변화를 최종 실행 모듈이자 외부모듈인 `socket.py`로 전달하도록 설계하였다.  

1. 콜백함수의 초기화와 전달 
```python
# socket.py
pulv_instance = PulvPhysic(pulv_name, update_callback=send_and_save_bias)
```
메인 실행 함수에서 PulvPhysic 클래스의 `__init__` 메서드에 update_callback 변수를 넘김으로써, 특정상황에서 `send_and_save_bias` 함수가 호출되도록 한다. 해당 함수는 이름 그대로 bias 데이터를 api로 보냄과 동시에 db에 저장하는 함수이다. 

```python
# PulvPhysic.py
class PulvPhysic:
    def __init__(self, pulv_type, update_callback=None):
        self.pulv = pulv_type
        self.update_callback = update_callback
        #.... 각종 초기화 함수
```
이렇게 PulvPhysic 클래스 생성 시 콜백 함수는 선택적으로 전달된다.

2. 콜백 호출

```python 
# PulvPhysic.py
if self.update_callback:
    self.update_callback([bias_data, db_data])
```
특정 작업이 완료가 되면 update_callback(`send_and_save_bias`) 함수를 호출하여 결과값을 전달한다. 

이렇게함으로써 클래스 내부에서 계산된 결과를 외부 모듈에서 전달 받아 처리할 수 있게 되었다. 

## 마무리
맨땅 헤딩해가며 개발하는 연구원으로서 머리로만 알던 이론을 이렇게 실무에 적용할 때 기분 very good