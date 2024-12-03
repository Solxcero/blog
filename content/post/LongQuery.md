+++
title = 'My Longest Query So Far'
date = 2024-12-02T18:48:04+09:00
draft = true
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


## DATE_SUB 와 DATE_ADD 대신 INTERVAL

## DENSE_RANK() 정처기에서 봤는데


