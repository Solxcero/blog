+++
title = 'Eventlet과 Monkey Patch'
date = 2024-12-12T21:20:49+09:00
categories = ["DevLog"]
+++

출근하여 퇴근할 때 까지 하루죙일 빌드만 했던 날이 있었다...   
import 에러, 모듈 경로 에러, eventlet 에러... 를 해치우고 빌드를 했더니,  
알고보니 설치하는 서버는 리눅스였단 사실...  
Ubuntu로 다시 환경설정해서 빌드하려는데 현장 gcc, glibc, python 등 버전 이슈가 계속 생기면서   
결국은 현장 리눅스 서버에 원격 접속하여 거기서 빌드했다는 결말  

암튼 그렇게 빌드하면서 흥미로웠던 내용이 있어서 글로 남기려고 한다.  

## eventlet
비동기 방식으로 프로그램을 돌리기 위해 eventlet 라이브러리를 사용하였다.  
근데 이게 개발환경에서는 실행이 아무 문제 없이 되는데,  
빌드하고 실행파일을 실행하면 꼭 `ValueError: Invalid async_mode specified` 에러가 나더라고.  
아래는 내가 해결할 떄 쓴 세가지 방법 (세 개다 해야함.)

1. SocketIO 초기화할 때 async_mode 지정
```python
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
```

2. eventlet 관련 라이브러리 spec 파일에 포함시키기
```shell
hiddenimports = [
    'greenlet',
    'dns',
    'eventlet.support',
    'eventlet.hubs',
    'eventlet.hubs.epolls',
    'eventlet.green',
    'eventlet.green.ssl',
    'eventlet.green.socket',
    'eventlet.green.select',
    'eventlet.green.threading',
    'socketio.async_drivers.eventlet',
]
```
상황에 따라 저거보다 더 필요할 수도있음. 

3. monkey_patch 를 소스 가장 상단에!
```python
import eventlet
eventlet.monkey_patch()
```

monkey_patch() ? 상당히 큐티한 이름이다 ㅋㅎ   
이게 뭘까?  
왜 소스 가장 상단에 입력해야할까?  
개발 환경에서는 해당 코드가 없어도 잘 작동하는데, 왜 빌드된 파일은 저 코드가 없으면 에러가 날까?   

자~ 알아봅시당

## Monkey Patch 
기본적으로 Python 표준 라이브러리는 동기적(Blocking)으로 동작한다고 한다.  
개발하려는 환경은 비동기 동작이 구현되어야 하므로, eventlet 라이브러를 사용한다.  
이때 `monkey_patch()` 는 Python의 표준 라이브러리들이 비동기 I/O를 지원하도록 패치하는 함수이다.  
즉, I/O와 관련된 함수와 스레드 등을 비동기적으로 실행할 수 있도록 도와준다.  
이와 관련하여 `Green Threads` 라는 개념이 있는데, 아래 블로그 내용으로 이해했다.  
[https://spoqa.github.io/2012/02/13/concurrency-and-eventlet.html](https://spoqa.github.io/2012/02/13/concurrency-and-eventlet.html)

## 그럼 왜 소스 상단으로? 
**표준 라이브러리 교체**   
해당 코드는 패치 코드이다.  
따라서 다른 라이브러리들이 import 되기 전에 비동기 패치가 완료 되어야 한다.  
만약 패치 코드 이전에 라이브러리를 import 하면 해당 모듈은 기존의 Blocking 버전의 객체로 로드되게 된다. 

비동기 I/O나 네트워크 처리를 위해 Eventlet의 그린 스레드를 사용하려면, 모든 관련 모듈이 비동기 버전을 참고해야 한다.

## 하지만 개발환경에서는 없어도 됐잖아? 
개발환경과 빌드환경의 차이를 이해해야 한다.  
개발환경에서는 표준 라이브러리와 Eventlet 라이브러리가 자연스럽게 공존한다고 한다.  
socket, threading, time 과 같은 모듈이 동기 버전으로 작동해도 동작하는 데 큰 문제가 없을 수 있다.  
Flask 나 Flask-SocketIO 같은 프레임워크는 개발환경에서는 종종 동기 모드를 허용하거나 기본적으로 동기방식으로 동작하기 때문이라고 한다.  

반면에 Pyinstaller 로 빌드한 실행 파일은 모든 Python 코드와 라이브러리를 하나의 실행 파일에 포함시키는데 이 과정에서 모듈의 로딩 순서와 라이브러리의 의존성이 변경될 수 있다.  
즉, Eventlet의 비동기 기능을 기대하는 부분이 Blocking 버전의 라이브러리를 사용할 수도 있다는 거다. 

또한, Flask-SocketIO는 비동기 처리를 위해 Eventlet이나 gevent 같은 비동기 드라이버를 사용한다.  
개발환경에서는 기본적으로 동기 모드로 동작하지만, 빌드된 실행 파일에서는 비동기 드라이버의 명확한 설정이 필요하다.  

## 또 급하게 마무리
야근까지하면서 에러잡고 결국은 대상 서버에 설치 완료된거까지 확인하고 집에 갔다는 이야기.  
그 과정에서 마주쳤던 Monkey patch는 한동안 계속 기억날 것 같다.  