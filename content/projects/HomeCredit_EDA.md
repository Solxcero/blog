+++
title = '🪪 HOME CREDIT #2:EDA'
date = 2026-01-04T11:00:50+09:00
draft = true
categories = []
+++

가장 중요한 전처리 단계이다. 
데이터의 품질이 모델의 성능을 결정하는 만큼, 그리고 모델의 설명 가능성이 매우 중요한 만큼,  
데이터 전처리 과정에서 두뇌를 가장 많이 사용하였다.  


## 1차 제거 변수들 
122개의 컬럼 중 1차적으로 필요 없는 컬럼들은 제외시켰다.  

### 결측치 비율로 변수 버리기
결측치는 이후 따로 처리하지만 그 전에 결측치가 너무 많은 변수들은 미리 제외하려고 한다.   
전체 데이터에서 결측 비율이 60% 이상인 변수들을 제외시켰다.  
비율의 기준에 대해서는 보통 50% 이상이면 신뢰도 문제로 제외시킨다고 하는데,  
사용하는 데이터의 경우 임계값을 50%로 잡으면 변수가 14개가 날라간다.  
그 중 중요해 보이는 변수들이 꽤 포함되어 있으서 그냥 내 임의로 60%로 했다.   
빅분기 필기 공부할 때도 연구자의 주관이 개입되는 부분이 전처리라고 했으니 문제 없지 않을까... 생각한다. 

```python
def drop_null_cols(df, threshold=0.6):
    """
    데이터프레임에서 결측치 비율이 threshold 이상인 변수를 제거하는 함수
    """
    null_percent = df.isnull().mean()
    drop_cols = list(null_percent[null_percent >= threshold].index)
    df = df.drop(drop_cols, axis=1)
    print(f"Dropped {len(drop_cols)} columns: {', '.join(drop_cols)}")
    return df

# Dropped 6 columns: OWN_CAR_AGE, YEARS_BUILD_AVG, COMMONAREA_AVG, FLOORSMIN_AVG, LIVINGAPARTMENTS_AVG, NONLIVINGAPARTMENTS_AVG
```

### 중복되는 집계 변수 제거
동일한 이름에 `_AVG`, `_MEDI`, `_MODE` 로 구분되어 있는 변수들이 있는데, 이들 중 `AVG` 변수들만 사용하기로 했다.   
이때 `_MODE` 데이터를 제외할 때 주의할 점이 있는데, 중앙값을 의미하는 변수가 아닌 타입을 의미하는 `_MODE` 변수들이 있어서 이 변수들은 제외하지 않아야 한다.  

```python
# 중복 정보 제거 (제거하면 안되는 MODE (중앙값 아닌거))
get_base = lambda sfx: [c.replace(sfx, '') for c in df.columns if c.endswith(sfx)]

mode = get_base('_MODE')
medi = get_base('_MEDI')
avg  = get_base('_AVG')

intersection = list(set(mode) & set(medi) & set(avg))
difference = list(set(mode) - set(medi) - set(avg))

mode_medi_cols = [col for col in df.columns if '_MODE' in col or '_MEDI' in col]
mode_medi_cols = [col for col in mode_medi_cols if col not in difference]
df.drop(columns=mode_medi_cols, inplace=True, errors='ignore')

# 제거 제외 변수:['EMERGENCYSTATE', 'TOTALAREA', 'FONDKAPREMONT', 'WALLSMATERIAL', 'HOUSETYPE']
```
초기에 122개에서 34개를 제외한 88개의 컬럼을 가지고 본격적인 전처리를 진행했다.  




## 1차 변수 처리
데이터들과 변수 설명서를 읽으면서 따로 특별히 처리해줘야할 변수들은 없을까 고민해봤다.  

그 결과 `_DAYS` 변수와 `FLAG_DOCUMENT` 변수는 나중에 분석에 더 용이하게 미리 별도 처리를 해주는 게 좋을 것 같다는 판단을 했다.  

### _DAYS 데이터 변환 
이 데이터셋의 특징 중 하나는 날짜 관련 데이터이다.   
DAYS_BIRTH, DAYS_REGISTRATION, DAYS_EMPLOYED 등 DAYS_로 시작하는 변수들이다.  
"time only relative to the application" 이라고 설명되어 있고, 데이터들은 대체로 음수 형태이다.   

<p align="center">
  <a href="/images/projects/home_credit/days_before.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/days_before.png" alt="Your Alt Text" >
  </a>
</p>

즉, 데이터 수집일을 (0) 기준으로 해당 일자를 역으로 계산하는 것이다.  
예를 들어 수집일 30일 전에 직장을 구했다면 해당 고객의 데이터는 -30 인거다.  

이러한 특징은 향후 데이터 해석이나 파생변수 생성 시 불편함을 줄 수 있기에 절댓값으로 변환해 양수로 변환하였다.  

그러나 그 전에 주의해야할 부분이 있다.  
`DAYS_EMPLOYED`의 경우 데이터 범위를 살펴보면 대체로 다 음수이지만 간혹 `365243` 값이 찍혀있다.  
이는 데이터 입력자가 무직인 고객을 구분하기 위해 임의의 양수값을 대입해둔 것이라고 한다.  

따라서 데이터를 변환하기 전에 해당 값은 다 0으로 처리하였다.(근무 일수가 없음)
그리고 무직 여부를 파악하는 별도의 플래그 변수도 생성해줬다. 

그렇게 수정된 데이터의 형태는 아래와 같다.  
<p align="center">
  <a href="/images/projects/home_credit/days_after.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/days_after.png" alt="Your Alt Text" >
  </a>
</p>



### FLAG_DOCUMENT 처리
데이터를 보면 `FLAG_DOCUMENT` 가 2부터 21까지 있는데(0:미제출, 1:제출), 저 문서들이 어떤 내용인지는 알 수가 없다.  
그렇기에 저 문서들을 다 가지고 분석하는 것 보다는 개별 문서 제출 패턴들을 먼저 파악하는 게 좋겠다고 판단했다.  


<p align="center">
  <a href="/images/projects/home_credit/flag_doc.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/flag_doc.png" alt="Your Alt Text" width="300" >
  </a>
</p>

문서 3의 경우 고객의 70%이상이 제출한걸로 보아 나름의 필수서류? 인듯하다. 

우선 각 고객이 제출한 문서의 총합 변수를 추가로 생성해줬다.  
그리고 필수 서류로 보이는 3번 문서를 제외하고 또 문서를 제외한 고객이 있다면 플래그 변수로 또 만들어주었다.  
또한 제출 빈도가 너무 낮은 서류의 경우는 오히려 도움이 안 될 것 같아 제거해 주었다. 

## 데이터 타입 분류

다음은 범주형, 수치형으로 컬럼을 구분해야 한다.  
`select_dtypes`으로 숫자와 문자열을 구분할 수 있지만,  
데이터 중에는 값은 숫자이지만 사실상 의미는 범주형인 변수들도 있다.  
예를 들면 `FLAG` 타입의 변수들이다.   
따라서 이 변수들은 별도로 범주형 컬럼 리스트에 넣어주어야 한다.  

변수명 하나하나 읽으면서 분류해도 되지만, 더 많은 변수를 다뤄야할 때를 대비해 약간의 편법(?)을 사용했다.  

데이터의 고유값이 특정 개수 이하는 데이터를 범주형으로 인식하는 것이다. 


```python
# 범주형, 수치형 변수 분류 
num_cols = df.select_dtypes(include=np.number).columns.tolist()
num_cols.remove('TARGET')

potential_cat_cols = []

# 기준 설정: 예를 들어 고유값이 threshold 미만인 경우
threshold = 4

for col in num_cols:
    if df[col].nunique() <= threshold:
        potential_cat_cols.append(col)

num_cols = [c for c in num_cols if c not in potential_cat_cols]
cat_cols = df.select_dtypes(exclude=np.number).columns.tolist() + potential_cat_cols

print(f"새롭게 분류된 범주형 변수: {potential_cat_cols}")

# 새롭게 분류된 범주형 변수: ['FLAG_MOBIL', 'FLAG_EMP_PHONE', 'FLAG_WORK_PHONE', 'FLAG_CONT_MOBILE', 'FLAG_PHONE', 'FLAG_EMAIL', 'REGION_RATING_CLIENT', 'REGION_RATING_CLIENT_W_CITY', 'REG_REGION_NOT_LIVE_REGION', 'REG_REGION_NOT_WORK_REGION', 'LIVE_REGION_NOT_WORK_REGION', 'REG_CITY_NOT_LIVE_CITY', 'REG_CITY_NOT_WORK_CITY', 'LIVE_CITY_NOT_WORK_CITY', 'FLAG_DOCUMENT_3', 'FLAG_DOCUMENT_5', 'FLAG_DOCUMENT_6', 'FLAG_DOCUMENT_8', 'FLAG_DOCUMENT_9', 'FLAG_DOCUMENT_11', 'FLAG_DOCUMENT_13', 'FLAG_DOCUMENT_14', 'FLAG_DOCUMENT_15', 'FLAG_DOCUMENT_16', 'FLAG_DOCUMENT_18', 'DAYS_EMPLOYED_ANOM', 'DOCUMENT_3_AND_OTHERS'] 
```

그 결과 총 46개의 범주형 변수와 35개의 수치형 변수로 분류하였다. 

## 변수 요약표

먼저 범주형 변수들.  
<p align="center">
  <a href="/images/projects/home_credit/home_credit_cat_sum.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/home_credit_cat_sum.png" alt="Your Alt Text" >
  </a>
</p>


그리고 수치형 변수들. 
<p align="center">
  <a href="/images/projects/home_credit/home_credit_num_sum.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/home_credit_num_sum.png" alt="Your Alt Text" >
  </a>
</p>

## 결측치
이제 정말 중요한 결측치 처리. 

### 범주형
범주형의 경우 결측값 자체도 의미가 있을 수 있다고 한다.  
즉, "고객이 정보를 제공하지 않았다" 라는게 정보가 될 수 있으니, 결측값을 'Unknown' 문자열로 채웠다.  


### 수치형
다음은 수치형인데 이게 좀 고민이 되었다.  

우선 변수의 특징상 대표값으로 대체하기 어려운 변수들이 있었다. 
`AMT_REQ_CREDIT_BUREAU` 와 `SOCIAL_CIRCLE` 가 들어간 변수들이다.   
'신용 조회 횟수' 와 '주변인 연체 횟수' 가 비어 있는 경우는 0으로 , 즉 이벤트가 발생하지 않은 경우로 봐도 되지 않을까? 생각했었다.  
내 생각이 타당한지 점검하기 위해 0인경우의 부도 비율과 Null인 경우의 부도 비율을 비교해봤다.  

그 결과 평균적으로 4% 정도의 비율차이가 있음을 확인했다.  

사실 4% 차이가 유의미한 차이인지는 내가 판단하기 어려워서 재미니한테 물어봤다.  
>금융 데이터(신용카드, 대출 등)에서 전체 부도율은 보통 5~10% 내외인 경우가 많습니다. 이때 4% 포인트의 차이는 상대적으로 매우 큰 비중을 차지합니다.  
0인 그룹: 실제로 조회가 발생했으나 횟수가 0이거나, 시스템에 기록된 "정상적 무실적" 상태일 가능성이 높습니다.  
Null인 그룹: 단순히 데이터 누락이 아니라, "정보가 없음(Unknown)" 자체에 특정한 의미가 있을 수 있습니다. (예: 신용 거래 이력이 아예 없는 신규 고객이거나, 특정 경로로 유입되어 정보 수집이 안 된 고객군)

그렇단다. 그래서 정보 여부 자체를 판단하는 IS_NULL 변수를 각각 추가로 생성해 준 후 해당 변수의 결측값은 0으로 대체하였다.  


그리고 그 외의 수치형 변수 처리 방식은 평균값, 최빈값, 중앙값 등 중에서 고민을 해봤다. 

결측값 비율이 40%가 넘는 데이터들의 분포를 그려봤다.  

<p align="center">
  <a href="/images/projects/home_credit/home_credit_num_dist.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/home_credit_num_dist.png" alt="Your Alt Text" >
  </a>
</p>


`EXT_SOURCE1`를 제외하면 모두 한쪽으로 치우친 분포를 띠고 있다.  
평균값으로 값을 대체할 경우 데이터 왜곡이 발생할 것 같았다. 
그래서 중앙값으로 결측값을 대체하기로 했다.  



> 그리고 이 경우에는 `datetime` 형태의 데이터가 없지만, 만약 날짜의 정보를 담고 있는 변수가 있다면 수치형으로 다루되 결측값은 Bfill이나 Ffill로 해야하지 않을까 생각이 들었다.  



## 파생변수 

그 다음은 모델의 성능을 높이기 위해 파생변수를 생성했다.  
이 부분은 다른 사례와 재미니의 도움을 좀 받았다.  


## 시각화

