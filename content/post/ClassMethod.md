+++
title = '드디어 @classmethod를 써본다'
date = 2024-11-01T10:45:44+09:00
tags = []
categories = ["DailyCoding"]
+++

배운 것을 실제로 내가 하고자하는 일에 적용했을 때의 쾌감이란 

`@classmethod`는 하나의 객체 내에서만 사용되는 것이 아니라 해당 클래스로 생성된 인스턴스 전체가 공유하는 함수라고 배웠었다.  
물론 간단한 실습은 했었지만 실제로 언제 사용하게 될지 궁금했었는데, 이번에 연구과제 프로젝트를 수행하면서 드디어 써봤다 우히히힣ㅎㅎ

왜 쓰게 됐냐면,  
화력발전소에는 A~F 까지 총 6대의 미분기가 존재한다.  
그래서 당연히 미분기 Class를 만들고, 6개의 객체를 생성해서 각 미분기에 부여된 id 값으로 테이블에서 조회 후 계산 결과를 다시 테이블에 저장하고 있었다. 

이때 서버를 실행하면 가장 마지막에 저장된 datetime 이나 id 값을 기준으로 연산이 진행되어야 하는데, 
특정 테이블의 경우 미분기 객체와 상관없이 id 번호가 부여되고 있었다. (DB는 내가 만든게 아니라 하핳)   

즉 미분기 A~F가 id 번호를 공유해서 사용해야되는 상황이었다.  

하나의 클래스에서 생성된 모든 객체가 특정 값을 공유한다? 이거슨 클래스 메서드잖아?
바아로오 적용

```python
# pulvbr.py
class PulvPhysic:
    bias_counter = 0 
    
    @classmethod
    def initialize_counter(cls, start_value):
        cls.bias_counter = start_value

    def update_bias(self):
        # 그외 생략
        type(self).bias_counter += 1
        bias_id = type(self).bias_counter
```
bias_counter라는 변수를 생성하여 모든 PulvPhysic 객체에서 해당 변수를 공유할 수 있도록 하였다. 
`@classmethod` 로 bias_counter를 초기화 하는 함수를 만들었다. `cls`를 사용하여 클래스 변수에 접근하여 초기화 하며 이 메서드는 인스턴스가 아니라 클래스 차원에서 직접 호출한다. 

실질적으로 bias_counter를 증가시키는 update_bias 함수가 있다. 
update_bias 함수가 각 객체에서 호출되면 bias_counter는 해당 클래스 내에서 증가하여 그 값을 모든 객체가 공유하게 된다. 

```python
# MyServer.py
initial_pulv_bias_value = DB_Process(db_connector,'A').get_last_bias()
PulvPhysic.initialize_counter(initial_pulv_bias_value)
```
요렇게 사용을 하면 된다. 
초기화할 bias_id를 DB 연산 모듈에 작성해둔 `get_last_bias()` 로 가져온 뒤 해당 값을 PulvPhysic의 bias_counter 초기 값으로 넘긴다. 
이렇게 하면 MultiThread로 생성된 각 Pulv 객체들이 update_bias 를 호출할 때 마다 bias_id를 업데이트한다. 

아이 재미따~~


추가로 `type(self)` 에 대해서는 잘 몰랐었는데 이번에 작업하면서 제대로 이해할 수 있었다.  
내가 만들어본 예제이다. 

```python
class Example:
    counter = 0  # 클래스 변수
    
    @classmethod
    def initialize_counter(cls, start_value):
        cls.counter = start_value

    def increment_counter(self):
        type(self).counter += 1      # 클래스 변수 증가
        
    def increment_counter_alternative(self):
        self.counter += 1           # 인스턴스 변수 증가         
        
Example.initialize_counter(2)       
ex = Example()
ex2 = Example()
print(ex.counter, ex2.counter) # 2 2

ex.increment_counter()
print(ex.counter) # 3

ex2.increment_counter()
print(ex2.counter) # 4

ex.increment_counter_alternative()
print(ex.counter) # 5

ex2.increment_counter_alternative()
print(ex2.counter) # 5
```

`type(self).counter` 는 `Example.counter` 와 동일하다는 것을 알 수 있다. 