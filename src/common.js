const { merge, fromEvent, Observable } = rxjs;
const { ajax } = rxjs.ajax;
const { map, switchMap, partition, pluck, first, share } = rxjs.operators;

export function handleAjax(property) {
    return obs$ => obs$
    .pipe(
        map(jsonRes => {
            if (jsonRes.error) {
                if (jsonRes.error.code === "4") {   // 결과가 존재하지 않는 경우
                    return [];
                } else {
                    throw jsonRes.error;
                }
            } else {
                if (Array.isArray(jsonRes[property])) {
                    return jsonRes[property];
                } else {
                    if (jsonRes[property]) {
                        return [jsonRes[property]];   // 1건만 전달된 경우 객체로 넘겨져 옮.
                    } else {
                        return [];
                    }
                }
            }
        })
    );
}

export function parseHash() {
    // routeId_routeName
    // 버스노선ID_버스번호
    const [routeId, routeNum] = location.hash.substring(1).split("_");
    return {
        routeId,
        routeNum
    };
}

export function createShare$() {
    const changedHash$ = merge(
        fromEvent(window, "load"),
        fromEvent(window, "hashchange")
    )
    .pipe(
	    map(() => parseHash()),
    	share()
    );

    let [render$, search$] = changedHash$.pipe(
        partition(({ routeId }) => routeId)
    );
    render$ = render$
    .pipe(
        switchMap(({ routeId }) => ajax.getJSON(`/station/pass/${routeId}`)),
        handleAjax("busRouteStationList")
    );

    return {
        render$,
        search$: search$.pipe(geolocation)
    };
}

function geolocation() {
    // 서울 시청
    const defaultPosition = {
        coords: {
            longitude: 126.9783882,
            latitude: 37.5666103,
        }
    };
    return new Observable(observer => {
        // geolocation 지원하는 경우 현재 위치를 구함.
        if (navigator.geolocation) {
            window.navigator.geolocation.getCurrentPosition(
                position => observer.next(position),
                error => observer.next(defaultPosition), 
                {
                    timeout: 1000 // 1초 내에 답변이 없으면 에러처리 
                }
            );
        } else {
            observer.next(defaultPosition);
        }
    }).pipe(
        pluck("coords"),
        first()
    );
}