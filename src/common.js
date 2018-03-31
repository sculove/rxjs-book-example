function geolocation(obs$) {
    // 서울 시청
    const defaultPosition = {
        coords: {
            longitude: 126.9783882,
            latitude: 37.5666103,
        }
    };
    return new Rx.Observable(observer => {
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
    })
    .pluck("coords")
    .first();
}

/**
 * json 통신 결과로 얻은 데이터를 처리하는 유틸
 * 
 * @export
 * @param {any} property json으로 받아오는 데이터 속성명
 * @returns 
 */
export function handleAjax(property) {
    return obs$ => obs$.map(jsonRes => {
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
                return [jsonRes[property]];   // 1건만 전달된 경우 객체로 넘겨져 옮.
            }
        }
    });
}

export function createShare$() {
    const changedHash$ = Rx.Observable.merge(
        Rx.Observable.fromEvent(window, "load"),
        Rx.Observable.fromEvent(window, "hashchange")
    )
    .map(() => parseHash())
    .share();

    let [render$, search$] = changedHash$.partition(({ routeId }) => routeId);
    render$ = render$
        .switchMap(({ routeId }) => Rx.Observable.ajax.getJSON(`/station/pass/${routeId}`))
        .let(handleAjax("busRouteStationList"));

    return {
        render$,
        search$: search$.let(geolocation)
    };
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
