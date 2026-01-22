+++
title = '🪪 HOME CREDIT #3:Modeling+Result'
date = 2026-01-04T11:00:50+09:00
draft = false
categories = []
tags = ['HomeCredit']
+++

## 피쳐 엔지니어링

총 99개의 독립변수들 중에서 다중공선성을 제거할 것이다.  

다중공선성을 제거하는 이유는 변수들 간의 상관성이 높을 경우 회귀 계수 추정의 불안정성 문제와 모델의 신뢰성 문제가 발생하기 때문이다.  

특히 회귀 계수를 지표로 사용하는 로지스틱 회귀의 경우 다중공선성 제거가 필수이다.  

XGBoost 와 같은 ML 모델의 경우 모델링 과정에서 필수 과정은 아니지만,  
변수들 간의 상관성이 높을 경우 추후 특정 변수의 변화가 다른 변수들에도 크게 영향을 줄 수 있기 때문에 모델의 신뢰성 확보 차원에서 필요한 단계라고 생각한다.  

다중공선성 제거는 1. 상관계수 기반 2. VIF 기반 순서로 진행했다.  

### IV 계산

그 전에 각 변수의 IV를 계산해두도록 하겠다. 이후 상관성이 높은 변수들 중 IV 점수를 기준으로 변수를 제외할 예정이기 때문이다. 

optbinning을 활용한 Woe , IV 계산 코드이다. 

```python
# --- [Step 1] 데이터 준비 및 분할 ---
X, y = df.drop(columns='TARGET'), df['TARGET']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
feature_list = cat_cols + num_cols

# --- [Step 2] BinningProcess 설정 및 학습 ---
selection_criteria = {
    "iv": {"min": 0.025, "max": 0.7, "strategy": "highest", "top": 30},
    "quality_score": {"min": 0.01}
}

binning_process = BinningProcess(
    variable_names=feature_list,
    categorical_variables=cat_cols,
    selection_criteria=selection_criteria
)

# Train 데이터로 Rule 학습
binning_process.fit(X_train, y_train)
```

`selection_criteria`로 Woe 및 IV 계산에 필요한 규칙들을 정해주었다. 
IV 기준에 따라 0.03 이상의 변수들만을 사용하려고 한다. 

최종적으로 선정된 30개 변수를 IV 기준으로 내림차순한 결과이다. 

<p align="center">
  <a href="/images/projects/home_credit/iv_summary.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/iv_summary.png" alt="Your Alt Text" width="500" >
  </a>
</p>

결과를 보니 `EXT` 변수들이 다른 변수들에 비해 IV 값이 큰 걸 알 수 있다.  
외부 기관의 신용점수인 만큼 그 어떤 변수보다 고객의 신용을 평가하는 데 큰 영향을 미친다는 건 어쩌면 당연한 사실이다.  

그러나 저 EXT 변수들이 다중공선성에서는 아마 몇 개 제외될거라 생각한다.  
그 다음으로는 근무 기간, 나이 등의 순서로 유의한 변수인걸 알 수 있다.  

주요 변수들의 구간별 부도확률을 시각화 해보자. 

먼저 `EXT_3` 변수이다. 

<p align="center">
  <a href="/images/projects/home_credit/EXT3_eventrate.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/EXT3_eventrate.png" alt="Your Alt Text" width="450" >
  </a>
</p>

'신용점수가 높을 수록 부도율이 낮다' 라는 일반상식에 부합하는 그래프이다.  
아마 독립변수들 중 가장 단조성이 잘 드러나는 변수가 아닐까 한다.  

그 다음은 `YEARS_EMPLOYED` 변수 이다. 

<p align="center">
  <a href="/images/projects/home_credit/yearsemp_eventrate.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/yearsemp_eventrate.png" alt="Your Alt Text" width="450" >
  </a>
</p>

일반적으로 변수가 단조성을 띄는게 모델의 성능에 좋다고는 하지만 예외인 경우도 있다.  
근속년수처럼 역U자가 오히려 비즈니스 로직에 부합하는 경우이다.  
이 경우에도 근속년수가 저연차-중연차일수록 부도율이 높은게 더 합리적인 해석이다.  

### 상관계수 계산 및 변수 탈락
이제 IV 값까지 다 구했으니 상관계수를 계산하여 변수를 1차 필터링 하겠다. 

```python
def remove_high_correlation(df_woe, iv_summary, threshold=0.8):
    corr_matrix = df_woe.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    
    to_drop = set() # 중복 제거를 위해 set 사용
    for column in upper.columns:
        high_corr_vars = upper.index[upper[column] > threshold].tolist()
        for var in high_corr_vars:
            # IV 값 추출 시 예외 처리 추가
            iv_col = iv_summary.loc[iv_summary['name'] == column, 'iv'].values[0]
            iv_var = iv_summary.loc[iv_summary['name'] == var, 'iv'].values[0]
            
            # IV가 낮은 쪽을 drop
            drop_target = column if iv_col < iv_var else var
            to_drop.add(drop_target)
    return list(to_drop)

low_iv_corr_vars = remove_high_correlation(X_train_woe, iv_summary, threshold=0.8)
X_train_reduced = X_train_woe.drop(columns=low_iv_corr_vars)
```

상관계수가 높은 변수 쌍과 각 변수의 IV를 기준으로 탈락한 변수이다.  

근속일수와 나이 변수의 경우 내가 파생변수를 만들고 기존 변수들을 따로 제거를 안해줘서 상관계수가 1이 나왔다.  


<p align="center">
  <a href="/images/projects/home_credit/corr_iv.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/corr_iv.png" alt="Your Alt Text" width="600" >
  </a>
</p>

이렇게 1차적으로 상관계수 기반 변수 필터링을 한 후 VIF를 계산하여 다시 필터링하겠다.  

### VIF 계산 및 변수 탈락 
상관계수가 변수의 1:1 관계만 판단한다면, VIF는 1:N 의 상관성을 판단하여 최종적으로 다중공선성을 제거할 수 있다.  


```python
def calculate_vif(df):
    vif_data = pd.DataFrame()
    vif_data["variable"] = df.columns
    # 상수항(intercept)에 의한 영향을 배제하기 위해 보통 WoE 데이터 그대로 사용
    vif_data["VIF"] = [variance_inflation_factor(df.values, i) for i in range(df.shape[1])]
    return vif_data

def iterative_vif_reduction(df, threshold=10):
    while True:
        vif_df = calculate_vif(df)
        max_vif = vif_df['VIF'].max()
        if max_vif > threshold:
            drop_var = vif_df.sort_values('VIF', ascending=False)['variable'].iloc[0]
            print(f"Dropping '{drop_var}' with VIF: {max_vif:.2f}")
            df = df.drop(columns=[drop_var])
        else:
            break
    return df

X_train_final_woe = iterative_vif_reduction(X_train_reduced, threshold=10)
final_selection_list = X_train_final_woe.columns.tolist()
```

이 결과 `EXT_SOURCES_MEAN`가 탈락하였다.  
나름 EXT 관련하여 파생변수들을 만들어 놨는데 탈락해버리 약간 서운하다.  


## 최종 변수 

최종 선정된 변수는 21개로 
```shell
'CODE_GENDER', 'NAME_INCOME_TYPE', 'NAME_EDUCATION_TYPE', 'OCCUPATION_TYPE', 'ORGANIZATION_TYPE', 'REGION_RATING_CLIENT_W_CITY', 'REG_CITY_NOT_WORK_CITY', 'FLAG_DOCUMENT_3', 'DAYS_EMPLOYED_ANOM', 'AMT_ANNUITY', 'AMT_GOODS_PRICE', 'REGION_POPULATION_RELATIVE', 'DAYS_REGISTRATION', 'EXT_SOURCE_1', 'EXT_SOURCE_2', 'EXT_SOURCE_3', 'LIVINGAREA_AVG', 'DAYS_LAST_PHONE_CHANGE', 'AGE', 'YEARS_EMPLOYED', 'PAYMENT_RATE'
```
이다. 

변수들을 분류해보자면, 

|군집|변수명|실무적 의미 및 해석|
|---|---|---|
|핵심 지표|EXT_SOURCE_1 2 3|외부 신용 정보. 모델에서 가장 강력한 변별력을 가짐|
|상환 능력|AMT_ANNUITY, PAYMENT_RATE, AMT_CREDIT|소득 대비 원리금 비중 및 상환 가능 수준을 측정|
|안정성/신뢰|AGE, YEARS_EMPLOYED, DAYS_ID_PUBLISH|연령 및 근속 연수는 소득 안정성과 정비례하는 경향이 있음|
|사회적 지위|OCCUPATION_TYPE, NAME_EDUCATION_TYPE|직업군과 교육 수준에 따른 부도 위험 차이를 반영|
|주거/환경|REGION_RATING_CLIENT_W_CITY, LIVINGAREA_AVG|거주 지역의 경제적 수준 및 자산 상태 추정|

이렇게 해석하면 될 듯하다. 

## Logistic Regression

신용평가에서 가장 많이 쓰는 전통 모형인 로지스틱 회귀 모델을 학습시키고 성능을 측정했다. 

이 때 threshold는 임의로 0.5로 지정하는 대신 Youden's J statistic 를 적용하여 최적의 threshold를 찾도록 하였다. 

확인해 볼 결과로는 AUC, Gini, KS 통계량, Confusion Matrix, 최적의 임계값, 등급별 부도율 이다.

```txt
Test AUC: 0.7491
Test Gini: 0.4983
Test K-S Statistic: 0.3726

Optimal Threshold: 0.4918

[Optimized Classification Report]
              precision    recall  f1-score   support

           0       0.96      0.67      0.79     56538
           1       0.16      0.70      0.26      4965

    accuracy                           0.67     61503
   macro avg       0.56      0.69      0.52     61503
weighted avg       0.90      0.67      0.75     61503


[Decile Analysis]
        count  bad_count  bad_rate
decile                            
0        6151       1634  0.265648
1        6150        860  0.139837
2        6150        675  0.109756
3        6150        473  0.076911
4        6151        411  0.066818
5        6150        267  0.043415
6        6150        226  0.036748
7        6150        200  0.032520
8        6150        137  0.022276
9        6151         82  0.013331
```

그리고 ROC 커브이다. 


<p align="center">
  <a href="/images/projects/home_credit/lr_roc.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/lr_roc.png" alt="Your Alt Text" width="450" >
  </a>
</p>

재미니한테 물어보니 AUC 기준 0.7 이상이면 양호한 성능이라고는 한다.  
하지만 아무래도 데이터 불균형 문제도 있고, woe 과정에서 더 정교한 분석을 하지 않아서 성능이 낮게 나올 수도 있다고 본다.  

이 학습 전에 threshold를 임의로 0.5로 두고도 학습해봤는데, 그 때는 부도 그룹의 recall이 0.1로 처참한 수준이었다.  
recall 지표를 높이기 위해 최적의 임계값을 찾아서 분류하였다 (precision의 희생을 곁들인.. 그래서 f1 score 자체는 크게 향상되지 않았다)  

금융기관에서는 부도 가능성 고객을 판별하는 것이 매우 중요하기 때문에 recall을 높이는 게 맞다고 생각한다. 
즉, 
"부도자를 더 많이 잡아내기 위해 대출을 거절당하는 사람 중 실제로는 갚을 능력이 있는 사람(정상인)이 섞여 있는 것을 감수하겠다."  
는 뜻이 된다.  

recall과 precision은 trade off 관계인 만큼 기관에서 어디에 더 중점을 줄지에 따라 분류 기준을 조정할 것이다. 

마지막으로 구간별 부도율 결과를 보면 신용점수 구간이 높을수록(점수가 높을수록) 부도율이 낮은 것을 확인할 수 있다. 
즉, 모델이 "신용점수가 낮을 수록 부도율이 높아지는가?"를 나름 잘 증명했다고 볼 수 있다.  

## XGBoost

1금융권과 같이 전통 금융 데이터가 많은 곳에서는 로지스틱 회귀를 많이 사용한다고 한다.  
하지만 신용 정보, 금융 거래 정보 등이 부족한 중저신용자 및 씬파일러 고객의 경우 전통 금융 데이터 외의 대안 정보를 결합하여 AI 모델로 신용평가를 진행하고 있다.  

이 데이터셋의 경우 대안정보는 포함되어 있지 않기 때문에 로지스틱 회귀와 XGBoost 간의 성능이 큰 차이를 보일 거 같지는 않았다.  

xgb의 파라미터는 아래와 같이 설정했다. 
```python
params = {
    'objective': 'binary:logistic',
    'eval_metric': 'auc',
    'learning_rate': 0.05,
    'max_depth': 4,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42,
    'scale_pos_weight': (y_train == 0).sum() / (y_train == 1).sum() # 클래스 불균형 해소
}
```

그리고 모델 결과는 아래와 같다.  

```txt
[XGBoost Final Performance]
Test AUC: 0.7570
Test Gini: 0.5140
Test K-S Statistic: 0.3806

Optimal Threshold (Youden's J): 0.4888

[Optimized Classification Report]
              precision    recall  f1-score   support

           0       0.96      0.69      0.80     56538
           1       0.16      0.69      0.26      4965

    accuracy                           0.69     61503
   macro avg       0.56      0.69      0.53     61503
weighted avg       0.90      0.69      0.76     61503


[Decile Analysis - Risk Ranking]
        count  bad_count  bad_rate
decile                            
9        6151       1680  0.273126
8        6150        899  0.146179
7        6150        638  0.103740
6        6150        477  0.077561
5        6150        376  0.061138
4        6151        306  0.049748
3        6150        204  0.033171
2        6150        196  0.031870
1        6150        113  0.018374
0        6151         76  0.012356
```

로지스틱에 비해 약간씩 성능이 더 잘 나왔다. 

결과 시각화 

<p align="center">
  <a href="/images/projects/home_credit/xgb_res.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/xgb_res.png" alt="Your Alt Text"  >
  </a>
</p>

EXT 변수야 당연히 중요도가 높을거라 생각했는데, 학력 변수도 꽤 높게 나온걸 알 수 있다.  

현재 학력 변수의 경우 두 구간으로 구간화가 되어 있다.  
- Academic degree, Higher education (EventRate : 0.053866	)
- Incomplete higher, Secondary / secondary special,Lower secondary (EventRate : 0.089380)

실제로 국내 신용평가에서도 학력이 신용 점수에 큰 영향을 줄지 궁금하다.  
어쩌면 단순히 고졸, 초대졸, 대졸 이 아니라 인서울 몇위 지거국 몇위 이런식으로 더 세분화 되어 있을 수도 있겠다. (+ 학과 정보도 있을수도)

## Score Card

최종적으로 스코어 카드를 시각화해봤다. 

<p align="center">
  <a href="/images/projects/home_credit/scorecard.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/scorecard.png" alt="Your Alt Text"  >
  </a>
</p>

이상적인 결과는 두 그룹의 분포 거리가 멀어야 한다. 

대체로 중반점수대에 고객이 몰려있고 부도 고객의 경우 초중반 점수대에 몰려있는 것을 알 수 있다.  

K-S 값으로도 확인했듯이 엄청 변별력이 있어보이는 결과는 아니다. 

## SHAP

이번엔 SHAP 를 확인해보았다.  
로지스틱 회귀와 달리 XGBoost는 변수 간의 복잡한 상호작용을 학습하기 때문에 '왜 이런 결과가 나왔는지' 설명하기 어렵다. (블랙박스모델)  

feature_importance로 변수의 중요도는 파악했지만 그 변수가 어느 방향으로 영향을 주는지는 파악하기 어렵다.  
그래프 상에서 0 기준으로 오른쪽은 부도확률을 높이는 데 기여하는 변수이다. 반대로 왼쪽은 부도확률을 낮추는 데 기여하는 변수이다.  

<p align="center">
  <a href="/images/projects/home_credit/shap.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/shap.png" alt="Your Alt Text"  >
  </a>
</p>

카테고리 변수와 수치형 변수의 결과 형태에 차이가 있음이 보인다.  

결과를 보며 인사이트를 찾아보자.  

방향성의 일치 (경제학적 타당성):

EXT_SOURCE 2 & 3: 높은 값(빨간색)이 왼쪽(부도 확률 감소)에 몰려 있음. 즉, 외부 신용 점수가 높을수록 우량 고객으로 판단 -> 모델의 논리가 타당함

AGE: 낮은 값(파란색, 젊은 층)이 오른쪽(부도 확률 증가)에 분포 -> 일반적으로 사회 초년생의 리스크가 상대적으로 높게 측정되는 경향을 반영  

LTV : LTV는 파생변수라는 측면에서 원천 데이터였던 AMT_CREDIT, AMT_GOODS_PRICE를 각각 모델에 적용하는 것보다 더 높은 성능에 기여한다는 것을 알 수 있다.  

그리고 해석에서 주의할 사항이 있다.  
SHAP 결과만 보면 LTV가 높을 수록 부도 리스크가 낮다 로 해석될 여지가 있다.(일반적으로 LTV와 부도리스크는 비례관계)  

이는 결과를 LTV값 으로 해석했기 때문이다.  
SHAP를 도출하는 데 사용된 데이터는 LTV의 WOE이다.  
따라서 LTV의 WoE가 클수록(우량 고객 비중이 많을수록) 부도 리스크는 낮아진다로 해석 해야 한다.  


## PDP
이번에는 주요 변수들의 Partial Dependence Plot을 그려보자  
X축은 해당 변수의 WoE 이며 Y축은 부도율이다.  

<p align="center">
  <a href="/images/projects/home_credit/PDP.png" data-lightbox="image-set">
    <img src="/images/projects/home_credit/PDP.png" alt="Your Alt Text"  >
  </a>
</p>


모두 부요율과 음의 관계를 보인다는 점에서 타당하다.  

그래프의 기울기로 해당 변수가 부도율에 얼마나 민감하게 영향을 주는지 알 수 있으며,  
세부적으로는 각 그래프의 기울기가 가팔라지는 구간을 살펴보는 게 중요하다.  

실습 코드   
[모델링.ipynb](https://github.com/Solxcero/my-domains/blob/main/HomeCreditDefault/HomeCreditDefault_Modeling.ipynb)