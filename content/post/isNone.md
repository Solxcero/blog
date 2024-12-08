+++
title = '왜 is None인가'
date = 2024-12-07T18:12:53+09:00
draft = true
categories = ["DevLog"]
+++

당연하게 쓰던 코드들이 갑자기 궁금해질 때가 있다.  

동료에게 계산 결과가 None인 경우를 처리해 달라고 부탁한 적이 있다.    

그러고 얼마 후 디버깅을 위해 코드를 살펴보던 중 특이한 점을 발견했다. 

```python
if x == None :
```
이렇게 `==` 비교 연산자로 조건문이 작성되어 있었다.   
>보통 is None 쓰지 않나?  
비교 연산자는 두 변수의 값을 비교하기 위한 건데, None은 값이라 할 수 있나?

라는 의문이 들었다. 


## None 은 무엇인가
파이썬에서 None은 단일객체 즉, 싱글톤이다.  
None 이라는 것은 말그대로 '값이 없다' 라는 뜻인데, 각 객체 마다 None이라는 값이 각자의 메모리를 갖는 것은 비효율적이다.  
그래서 하나의 프로그램에서 모든 None 값은 동일한 메모리 주소를 공유한다.   

그리고 자체적으로 데이터타입을 가진다. 
```python
print(type(None))  # <class 'NoneType'>
```
실제로 동일한 메모리 주소를 공유하는지도 살펴보자.  

```python
x = None
y = None
print(x is y)  # True
print(id(x) == id(y)) # True
```
x,y 두 None이 동일한 주소를 공유한다는 것을 알 수 있다.  

## 왜 is None일까?

사실 비교연산자로 None 을 판단해도 작동이 되긴한다.  
하지만 파이썬은 is None을 권장한다. 왜냐면!

`==` 은 변수의 `동등성` 을 확인하고, `is` 는 변수의 `정체성`을 확인하기 때문이다.  
동등성은 값이 같은지를 판단하며 정체성은 값이 동일한 객체인지를 판단한다고 보면 된다.  
즉, None은 모든 객체가 참조하는 하나의 주소이기 때문에 정체성을 판단해주는 `is`를 써야 한다는 것이다.  

예제를 보면 이해가 쉬워진다. 
```python
class CustomObject:
    def __eq__(self, other):
        return True

obj = CustomObject()

print(obj == None)  # True
print(obj is None)  # False
```
`==`연산자는 객체의 `__eq__` 메서드를 호출하게 되어 있다.  
여기서는 `CustomObject` 클래스를 활용하여 `__eq__` 메서드를 오버라이드(재정의) 했다. (항상 True를 반환하도록)
즉, 비교연산자는 `__eq__` 메서드에 의존하므로 이 메서드가 변경될 경우 동일한 결과를 보장받지 못한다.  
그러나 `is` 의 경우 객체의 주소를 확인하기 때문에 언제나 명확하게 None을 판단할 수 있다.  

## PEP8가 그러라 했음
가장 중요한 사실은 PEP8에서 is None을 쓰라고 명시해뒀다.  
>Comparisons to singletons like None should always be done with is or is not, never the equality operators.

## 결론
지금까지 is None을 당연하듯이 써왔지만 그 이유를 제대로 생각해본 적은 없었는데, 이번 기회로 알 수 있게 되었다.  


## (추가로 알게됨) 파이썬의 정수 캐싱 메커니즘
비교연산자 예제를 만들다가, None이 아닌 값을 대입 시킨 후 주소를 비교하면 같은 값이라도 주소가 다르게 나오겠지? 라고 생각을 했다.  
```python
a = 1
b = 1
print(a is b)           # True
print(id(a) == id(b))   # True
```
잉???? 내 생각은 이게 아니었는데..?  
찾아보니 파이썬은 메모리 최적화를 위해 정수 (-5 ~ 256) 까지는 캐싱을 동해 동일한 객체를 재사용한다고 한다. 

```python
a = 257
b = 257
print( a is b )         # False
print( id(a) == id(b) ) # False
```

파이썬이 불변객체(int,tuple,str)에 대해 캐싱을 적용하는 경우가 있다고 한다.  

```python
x = "hello"
y = "hello"
print(x is y)           # True (캐싱됨)
print(id(x) == id(y))   # True
```
이렇게 짧은 문자열의 경우 동일한 주소를 갖는 것을 알 수 있다.  
불변객체의 범위 혹은 길이가 길어지면 캐싱이 되지 않는데, 그건 인터프리터에 따라 다르다고 한다.  

하나 또 알고 간다 ~!