// function createGeolocation$() {
//     // 서울 시청
//     const defaultPosition = {
//         coords: {
//             longitude: 126.9783882,
//             latitude: 37.5666103,
//         }
//     };
//     return new Rx.Observable(observer => {
//         // geolocation 지원하는 경우 현재 위치를 구함.
//         if (navigator.geolocation) {
//             window.navigator.geolocation.getCurrentPosition(
//                 position => observer.next(position),
//                 error => observer.next(defaultPosition), {
//                     enableHighAccuracy: false, // 빠른 응답을 위해 세밀한 정보를 받지는 않음.
//                     timeout: 1000 // 1초 내에 답변이 없으면 에러처리 
//                 }
//             );
//         } else {
//             observer.next(defaultPosition);
//         }
//     })
//         .pluck("coords")
//         .first();
// }    

// /**
//  * json 통신 결과로 얻은 데이터를 처리하는 유틸
//  * 
//  * @export
//  * @param {any} property json으로 받아오는 데이터 속성명
//  * @returns 
//  */
// export function handleAjax(property) {
//     return obs$ => obs$.mergeMap(jsonRes => {
//         if (jsonRes.error) {
//             if (jsonRes.error.code === "4") {   // 결과가 존재하지 않는 경우
//                 return Rx.Observable.of([]);
//             } else {
//                 return Rx.Observable.throw(jsonRes.error);
//             }
//         } else {
//             if (Array.isArray(jsonRes[property])) {
//                 return Rx.Observable.of(jsonRes[property]);
//             } else {
//                 return Rx.Observable.of([jsonRes[property]]);   // 1건만 전달된 경우 객체로 넘겨져 옮.
//             }
//         }
//     });
// }

// export function parseHash() {
//     // routeId_routeNum_stationId(옵션)
//     // 버스노선ID_버스번호_정류소번호(옵션)
//     const [routeId, routeNum, stationId] = location.hash.substring(1).split("_");
//     return {
//         routeId,
//         routeNum,
//         stationId
//     };
// }

// export function createShare$() {
//     const event$ = Rx.Observable.merge(
//         Rx.Observable.fromEvent(window, "load"),
//         Rx.Observable.fromEvent(window, "hashchange")
//     )
//     .do(v => console.info("[EVENT-Share]", v.type))
//     .map(() => parseHash())
//     .do(v => console.info("[Share]", v))
//     .finally(v => console.info("[finally-sidebar]", v))
//     .share();

//     let [render$, search$] = event$.partition(({ routeId }) => routeId);
//     // http://localhost:3000/ (초기 로딩 - 찾기)
//     // http://localhost:3000/#232000098_8601A_100000025 (마커에 의해 - render, scrollTo)
//     // http://localhost:3000/#219000016_1200 (자동완성에 의해 - render, scrollTo)

//     render$ = render$.switchMap(({ routeId }) => Rx.Observable.ajax.getJSON(`/station/pass/${routeId}`))
//         .let(handleAjax("busRouteStationList"))
//         .map(stations => stations.filter(station => !!station.mobileNo))
//         .do(v => console.info("[render]", v))
//         .finally(v => console.info("[finally-render]", v));

//     return {
//         render$,
//         search$: search$.switchMap(() => createGeolocation$())
//     };
// }
