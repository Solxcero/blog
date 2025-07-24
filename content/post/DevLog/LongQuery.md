+++
title = 'My Longest Query So Far'
date = 2024-12-02T18:48:04+09:00
draft = false
categories = ["DevLog"]
+++

DB 인터페이스 개발할 때 사용하는 쿼리문들은 간단한 조회, 삽입 수준이라 평소에 쿼리문을 짜기 위해 깊은 고민을 했던 적이 없었다.  

하지만, 이번에 데이터분석을 하면서 긴 쿼리를 작성해보게 되었다.  
이 글은 그저 그 뿌듯함에 취해 작성하는 글임을 밝힌다. 누군가에게 도움이 될 수준은 아닌듯  

## 어떤 결과를 원했나

테이블이 두 개가 있다. 
- collect_data : 1분 단위로 실시간 데이터가 쌓이는 테이블. data_set_id로 어떤 부류의 데이터 묶음인지 판단함.
- change_history : 특정 설비에 알람이 발생할 경우 저장됨. 

> change_history 의 알람 이력을 뽑은 후 collect_data에서 해당 알람이 저장됐을 때의 실시간 데이터 -30분에서 +340분까지 조회. 이때 알람을 trend_no로 지정하여 그룹핑 

## 최종 쿼리 
요것이 나의 최종 쿼리
```sql
WITH TrendGroups AS (
    SELECT 
        c.tag_list, 
        c.collect_time,
        CASE 
            WHEN c.collect_time = cmch.collect_time THEN cmch.change_trend
            ELSE NULL
        END AS change_trend, -- 본래 조건 유지
        cmch.collect_time AS trend_time
    FROM 
        collect_data c
    JOIN (
        SELECT 
            collect_time,
            change_trend
        FROM 
            change_history        WHERE 
            pulv_id = 1 AND collect_time >= '2024-11-24 23:50:00'
        ORDER BY 
            collect_time ASC
        LIMIT 40
    ) cmch 
    ON c.collect_time BETWEEN cmch.collect_time - INTERVAL 30 MINUTE
                          AND cmch.collect_time + INTERVAL 340 MINUTE
    WHERE 
        c.data_set_id = 41
)
SELECT 
    tag_list, 
    collect_time, 
    change_trend, 
    DENSE_RANK() OVER (ORDER BY trend_time ASC) AS trend_no
FROM 
    TrendGroups
ORDER BY 
    collect_time;
```

## CTE 썼구요
임시 테이블(데이터세트) `TrendsGroup`을 생성해주었다.  
물론 그냥 서브쿼리로 작성을 해도 아무 문제 없이 동작했겠지만,  
쿼리의 가독성을 높이려면 CTE를 써라... 라고 인터넷이 그러길래. 
써보고 나니 확실히 가독성이 좋다.  
수정할 때도 편하구..


## CASE WHEN 쓰셨구요
trend change 데이터가 있는 경우 그 값을 그대로 가져오되,  
함께 뽑히는 앞 뒤 구간 데이터에는 Null 로 들어가게 하기 위해서다.
CASE WHEN을 안쓰고 뽑으면 trend change 전체 구간에 해당 값이 다 들어가서 
원래 어느 TimeStamp에 change. 알람이 왔는지 구분할 수가 없다.   

이건 데이터 형태를 모르면 무슨말인지 이해가 잘 안될테지만, 나는 알고있으므로 괜츈.

## DATE_SUB 와 DATE_ADD 대신 INTERVAL
원래는 DATE_SUB 랑 DATE_ADD 썼는데, INTERVAL 이 더 가독성 좋아보여서 바꿨다.  
동적 연산에 주로 사용되는 방식으로 내가 찾아봤을 땐 기능적으로는 큰 차이가 없어보였다. 

## DENSE_RANK() 정처기에서 봤는데
정처기 실기 시험 준비하면서 공부했던 RANK 함수를 드뎌 써봤당. 
'순위'라는 개념이 필요해서는 아니고 각 change 그룹마다 번호를 부여해야하는데, 같은 그룹끼리는 동일한 번호를 주기 위해 DENSE_RANK를 썼다.

## 진짜 별거없는 결론
암튼 내 인생 가장 길었던 쿼리~  
쿼리 짜는거 재밌어서 앞으로도 실무에 계속 써먹으면서 실력 키울 수 있으면 좋겠당 
