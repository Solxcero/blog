+++
title = 'IF문의 오버헤드'
date = 2024-07-06T22:00:55+09:00
tags = []
categories = ["DailyCoding"]
+++

## 백준 BOJ거리 문제를 풀다가
BOJ 거리 문제는 DP 알고리즘 문제로 B,O,J 블록을 순서대로 점프하면서 최소한의 에너지로 종료지점에 도착해야하는 문제이다. [문제링크](https://www.acmicpc.net/problem/12026)  

아래는 내가 짠 코드이다. 

```python
import sys

input = sys.stdin.readline

N = int(input())
blocks = str(input().strip())

jump_order = {'B':'O','O':'J','J':'B'}

max_energy = 999*999 + 1
# 소요된 에너지를 저장 -> 최솟값 업데이트를 위해 최댓값으로 저장
dp = [max_energy] * N
dp[0] = 0  # 처음 위치에서 에너지 0 -> 즉, dp[i] 는 i칸에 가기 위한 에너지의 최솟값

for i in range(N):
    if dp[i] == max_energy:
        continue
    for j in range(i+1,N):
        if blocks[j] == jump_order[blocks[i]]:
            dp[j] = min(dp[j],(j-i)*(j-i)+dp[i])
            # print(dp)

print(dp[-1] if dp[-1] != max_energy else -1)
```
간단히 설명하자면 미리 최댓값으로 초기화한 배열에서 연산을 반복하면서 최솟값으로 업데이트 하는 방법을 구현한 것이다.  

## 나는 분명 효율적인 코드를 짰는데..?
알고리즘 문제를 풀다보면 수많은 시간 초과와 메모리 초과 에러를 만나게 된다.  
그러다보면 코드를 짤 때 최대한 불필요한 연산을 줄이는 효율적인 코드를 짜려고 노력을 하게 된다.  
위의 내가 짠 코드도 그러한 고민을 거쳐서 나온 코드이다.  

특히 
```python
    if dp[i] == max_energy:
        continue
```
이 부분은 블록을 점프할 때, 블록 값이 `max_energy` 라면 애초에 점프할 수 없는 블록이기에 "아래의 반복문 연산을 하지 않아도 된다" 라는 제한 조건을 걸어 둔 것이다. 
"코드 두 줄로 불필요한 연산을 줄였으니 분명 시간을 단축시켰겠지?!"  라는 설렘을 가지고 해당 조건문을 없애고 다시 코드를 제출해 봤다. 

![코드제출결과화면](/static/images/12026.png)

놀랍게도(?) 위에가 조건문이 없는 코드이다. 물론 미세한 시간 차이이긴 하지만, 그럼에도 내 예상을 빗나간 결과라 상당히 의아했다. 불필요한 연산을 하는게 더 빠르다..? 이걸 어떻게 이해해야하지..?  
혼자 고민하다가 그냥 GPT 에 물어봤다. 놀랍도록 발전한 세상에 감사합니다..  

> ### 성능 차이의 이유
> - **캐시 효율성:** 두 번째 코드는 모든 `i`에 대해 모든 `j`를 루프하므로, 메모리 접근 패턴이 더 일관적일 수 있습니다. 이는 CPU 캐시 효율성을 높여 더 빠른 실행 시간을 가져올 수 있습니다.
> - **조건문 오버헤드:** 첫 번째 코드의 조건문 `if dp[i] == max_energy: continue`는 루프 내에서 매번 확인되므로, 오버헤드가 추가될 수 있습니다. 이는 작은 차이로 보일 수 있지만, 많은 반복 횟수에서 누적되어 성능에 영향을 줄 수 있습니다.
> ### 결론
>해당 조건문이 없는 코드가 더 빠르게 실행되는 이유는:
>- 모든 가능한 경우를 고려하여 더 일관된 메모리 접근 패턴을 가지기 때문입니다.
>- 조건문 오버헤드가 없기 때문입니다.

ㅇ.ㅇ.!!!!!!   
뭔가 그럴 듯 하다!!! 
`일관된 메모리 접근 패턴` , `조건문 오버헤드`  라는 개념을 이렇게 만나게 되었다.  
제출 결과를 보면 메모리 측면에서는 성능 차이가 없었기 때문에 결국 `조건문 오버헤드`  이 친구가 범인이었다.   
(조건문 오버헤드는 단순히 조건문을 검사하는 비용뿐 아니라 메모리 접근 패턴의 일관성에도 영향을 주는 것 처럼 보인다.)  

## 그래서 제가 직접 해보았습니다. 

```python
import time
import random

def with_condition(N, blocks):
    jump_order = {'B': 'O', 'O': 'J', 'J': 'B'}
    max_energy = 999*999 + 1
    dp = [max_energy] * N
    dp[0] = 0

    for i in range(N):
        if dp[i] == max_energy:
            continue
        for j in range(i + 1, N):
            if blocks[j] == jump_order[blocks[i]]:
                dp[j] = min(dp[j], (j - i) * (j - i) + dp[i])
    return dp[-1] if dp[-1] != max_energy else -1

def without_condition(N, blocks):
    jump_order = {'B': 'O', 'O': 'J', 'J': 'B'}
    max_energy = 999*999 + 1
    dp = [max_energy] * N
    dp[0] = 0

    for i in range(N):
        for j in range(i + 1, N):
            if blocks[j] == jump_order[blocks[i]]:
                dp[j] = min(dp[j], (j - i) * (j - i) + dp[i])
    return dp[-1] if dp[-1] != max_energy else -1

# 랜덤으로 BOJ 블록 생성하기 
N = 10000
blocks = ''.join(random.choice('BOJ') for _ in range(N))

# 조건문 있는 경우
start_time = time.time()
result_with_condition = with_condition(N, blocks)
end_time = time.time()
print(f"IF문 있음: {result_with_condition}, Time: {end_time - start_time:.6f} seconds")

# 조건문 없는 경우 
start_time = time.time()
result_without_condition = without_condition(N, blocks)
end_time = time.time()
print(f"IF문 없음: {result_without_condition}, Time: {end_time - start_time:.6f} seconds")
```

`with_condition`  함수와 `without_condition` 함수를 만들어서 실행시간을 측정해보았다.   
이때 BOJ 블록은 그냥 랜덤으로 생성하되 일정 시간이 걸려야 하므로 블록길이 N을 크게 주었다.  

기대되는 실행 결과는~~~

![결과1](/static/images/12026_1.png) 
잉? 뭐야 조건문 있는게 더 빠르잖아~~~ 다시다시

![결과2](/static/images/12026_2.png)
뭐야뭐야~~~ 이번엔 조건문 없는게 더 빠르네?? 

그렇다면 결과의 차이를 만드는 녀석은 내가 랜덤으로 생성한 BOJ 배열 이다..!  


## 그래서 제가 직접 해보았습니다 2
blocks 데이터를 두 가지 경우로 만들어 보았다.  

#### 조건문이 있는게 도움이 되는 경우 
```python
blocks = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBJBOJ'
```
BOJ가 연속적이지 않은 경우이다. 
![결과3](/static/images/12026_3.png)
처음 B에서 다음 O가 나올 때까지 `dp[i] == max_energy` 조건에 걸려 반복문 연산을 다 건너뛰기 때문에 if 문이 있는 코드가 더 빠르게 통과한다.  


#### 조건문이 없는게 나은 경우 

```python
blocks = 'BOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJBOJJ'
```
BOJ가 연속적인 패턴으로 등장하는 경우이다. 
![결과4](/static/images/12026_4.png)
블록의 매 순서가 IF문에 해당하지 않아 거의 모든 순서에서 반복문을 실행해야 한다.  따라서 IF 문의 역할이 미미하다.  

## 결론
내가 목표했던 최적화는 입력되는 데이터 와 실행 환경에 따라 달라질 수 있다는 것을 배웠다. 
