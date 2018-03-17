import {handleAjax} from "./common.js";

function getBuesType(name) {
    if (/^광역/.test(name)) {
        return "yellow";
    } else if (/^직행/.test(name)) {
        return "red";
    } else {
        return "";
    }
}
// 네이버 지도 생성
function createNaverMap($map) {
    return new naver.maps.Map($map, {
        zoom: 11,
        minZoom: 6
    });
}
// 네이버 지도 위에 표시할 정보윈도우 생성
function createNaverInfoWindow() {
    return new naver.maps.InfoWindow();
}
export default class Map {
    setCenter(coord) {
        this.naverMap.setCenter(
            new naver.maps.LatLng(coord.latitude, coord.longitude)
        );
        this.naverMap.setZoom(11);
        this.infowindow.close();
    }
    drawPath(stations) {
        // 경로를 지도에 표시한다.
        // https://navermaps.github.io/maps.js/docs/tutorial-polyline-dynamic.example.html
        // 기존 패스 삭제
        this.polyline && this.polyline.setMap(null);
        this.polyline = new naver.maps.Polyline({
            map: this.naverMap,
            path: [],
            strokeColor: "#386de8",
            strokeWeight: 5,
            strokeStyle: "shortdash"
        });
        // 패스 그리기 
        const path = this.polyline.getPath();
        stations.forEach(station => {
            path.push(new naver.maps.LatLng(station.y, station.x))
        });
    }
    deletePath() {
        // 기존 패스 삭제
        if (this.polyline) {
            this.polyline.setMap(null);
            this.polyline = null;
        }
    }    
    constructor($map, search$) {
        this.naverMap = createNaverMap($map);
        this.infowindow = createNaverInfoWindow();
        
        const buses$ = this.createBuses$(search$);
        buses$
            .do(v => console.warn("===> buses", v))
            .subscribe({
                next: data => {
                    const before = this.infowindow.getPosition();
                    const after = data.marker.getPosition();
                    if (after.equals(before) && this.infowindow.getMap()) {
                        this.infowindow.close();
                    } else {
                        this.naverMap.panTo(after, { duration: 300 });
                        this.infowindow.setContent(this.render(data));
                        this.infowindow.open(this.naverMap, data.marker);
                    }
                },
                error: console.error,
                complete: console.warn
            });
        // 에러 및 불필요한 동작 제거
    }
    createStation$(search$) {
        return search$.merge(
                Rx.Observable.fromEvent(this.naverMap, "dragend") // 지도 영역을 dragend 했을 경우도 추가
                    .do(v => console.log("dragend", v))
                    .map(({ coord }) => ({
                        longitude: coord.x,
                        latitude: coord.y
                    }))
            )
            .switchMap(coords => Rx.Observable.ajax.getJSON(`/station/around/${coords.longitude}/${coords.latitude}`))
            .let(handleAjax("busStationAroundList"))
            .do(v => console.info("[stations]", v))
            .finally(v => console.info("[finally-stations]", v))
    }
    createMarker$(stataions$) {
        return stataions$
            .map(stations => stations.map(station => new naver.maps.Marker({
                map: this.naverMap,
                title: station.stationName,
                position: new naver.maps.LatLng(station.y, station.x),
                id: station.stationId,  // 임의로 저장하는 값 
                stationId: station.stationId, // 임의로 저장하는 값 
                stationName: station.stationName, // 임의로 저장하는 값 
                mobileNo: station.mobileNo, // 임의로 저장하는 값 
            })))    // marker로 변경
            .scan((prev, markers) => {
                if (prev) {  // 이전 markers 삭제
                    prev.forEach(marker => marker.setMap(null));
                }
                prev = markers;
                return prev;
            }, [])
            .mergeMap(markers => Rx.Observable.from(markers))
            .do(v => console.count("[markers]"))
            .finally(v => console.info("[finally-markers]", v))
    }
    createMarkerClick$(marker$) {
        return marker$
            .mergeMap(marker => Rx.Observable.fromEvent(marker, "click"))
            .map(({ overlay }) => ({
                marker: overlay,
                position: overlay.getPosition(),

                // 사용자 정보 (하위)
                id: overlay.getOptions("id"),
                stationId: overlay.getOptions("stationId"),
                stationName: overlay.getOptions("stationName"),
                mobileNo: overlay.getOptions("mobileNo"),
            }))
            .do(v => console.info("[markerClick]", v))
            .finally(v => console.info("[finally-markerClick]", v))
            .share(); // 공유해야만 한다. buses할 때 최신값을 알아야하니깐.
    }
    createBuses$(search$) {
        // search 메소드를 호출했을 경우에만 처리 (_search$$ 를 통해 전달 받음)
        const stataions$ = this.createStation$(search$);
        const marker$ = this.createMarker$(stataions$);
        const markerClick$ = this.createMarkerClick$(marker$);
        
        // stationId를 통해 해당 역을 지나가는 버스 리스트 조회 스트림
        return markerClick$
            .filter(({ marker }) => !!marker.mobileNo)
            .switchMap(({ id }) => Rx.Observable.ajax.getJSON(`/bus/pass/station/${id}`))
            .let(handleAjax("busRouteList"))
            .withLatestFrom(markerClick$, (buses, markerInfo) => ({
                ...markerInfo,
                buses: buses.concat()
            }))
            .do(v => console.info("[buses]", v))
            .finally(v => console.info("[finally-buses]", v))
    }

    // infowindow에 표기할 정류소를 지나가는 버스들 표시
    render({ stationId, stationName, mobileNo, buses}) {
        let list = buses.map(bus => (`<dd>
                <a href="#${bus.routeId}_${bus.routeName}_${stationId}">
                    <strong>${bus.routeName}</strong> <span>${bus.regionName}</span> <span class="type ${getBuesType(bus.routeTypeName)}">${bus.routeTypeName}</span>
                </a>
            </dd>`)).join("");

        return `<dl class="bus-routes">
            <dt><strong>${stationName}</strong> <span>(${mobileNo})</span></dt>${list}
        </dl>`;
    }
}
