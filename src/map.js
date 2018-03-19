// import {handleAjax} from "./common.js";

// 버스 타입의 클래스를 결정하는 함수
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
    // 네이버 지도API를 이용하여 지도의 중앙을 주어진 좌표로 이동하고 지도의 zoom을 11로 지정한다. 또한 infoWindow를 닫는다.
    centerMapAndCloseWindow(coord) {
        this.naverMap.setCenter(
            new naver.maps.LatLng(coord.latitude, coord.longitude)
        );
        this.naverMap.setZoom(11);
        this.infowindow.close();
    }
    // 지도의 특정 위치에 마커를 생성한다.
    createMarker(name, x, y) {
        return new naver.maps.Marker({
            map: this.naverMap,
            title: name,
            position: new naver.maps.LatLng(y, x),
        });
    }
    // 지도에 있는 마커를 제거한다.
    deleteMarker(marker) {
        marker && marker.setMap(null);
    }
    // 정류소 정보를 바탕으로 네이버 지도API를 이용하여 지도에 경로를 그린다.
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
    // 네이버 지도API를 이용하여 지도에 경로가 있다면 지운다.
    deletePath() {
        // 기존 패스 삭제
        if (this.polyline) {
            this.polyline.setMap(null);
            this.polyline = null;
        }
    }
    // 지도 위에 표시되는 info 윈도우를 토글한다.
    // 꼭! HTML문자열을 반환하는 render 함수를 구현해야한다.
    toggleInfoWindow(marerkInfo) {
        const before = this.infowindow.getPosition();
        if (marerkInfo.position.equals(before) && this.infowindow.getMap()) {
            this.infowindow.close();
        } else {
            this.naverMap.panTo(after, { duration: 300 });
            // this.infowindow.setContent(this.render(marerkInfo));
            // this.infowindow.open(this.naverMap, marerkInfo.marker);
        }
    }
    // constructor($map, search$) {
    constructor($map) {
        this.naverMap = createNaverMap($map);
        this.infowindow = createNaverInfoWindow();
        
        const station$ = this.createDragend$()
            .let(this.mapStation)
            .let(this.manageMarker.bind(this))
            // .share()
            .let(this.mapMarkerClick)

        const buses$ = station$.let(this.mapBus);
        Rx.Observable.combineLatest(
            station$,
            buses$
        )
        .subscribe(markerInfo => console.log("1",markerInfo));
        // buses$.subscribe(markerInfo => console.log("2",markerInfo));
    }
    createDragend$() {
        return Rx.Observable.fromEvent(this.naverMap, "dragend") // 지도 영역을 dragend 했을 때
            .map(({ coord }) => ({
                longitude: coord.x,
                latitude: coord.y
            }))
    }
    mapBus(markerInfo$) {
        return markerInfo$
            .switchMap(({id}) => Rx.Observable.ajax.getJSON(`/bus/pass/station/${id}`))
            .pluck("busRouteList")
    }
    mapStation(coord$) {
        return coord$.switchMap(coords => Rx.Observable.ajax.getJSON(`/station/around/${coords.longitude}/${coords.latitude}`))
            .pluck("busStationAroundList")
    }
    manageMarker(station$) {
        return station$
            .map(stations => stations.map(station => {
                const marker = this.createMarker(station.stataionName, station.x, station.y);
                // 버스정류소ID, 버스정류소 이름 정보를 marker에 저장
                marker.setOptions("id", station.stationId);
                marker.setOptions("name", station.stationName);
                return marker;
            }))
            .scan((prev, markers) => {
                // 이전 markers 삭제
                prev.forEach(this.deleteMarker);
                prev = markers;
                return prev;
            }, [])
            .mergeMap(markers => Rx.Observable.from(markers))
    }
    mapMarkerClick(marker$) {
        return marker$.mergeMap(marker => {
                return Rx.Observable.fromEvent(marker, "click")
                .map(({ overlay }) => ({
                    marker: overlay,
                    position: overlay.getPosition(),
                    id: overlay.getOptions("id"), // 버스정류소ID 정보를 얻음
                    name: overlay.getOptions("name") // 버스정류소 이름을 얻음
                }));
        });
    }
    
    // createBuses$(search$) {
    //     // search 메소드를 호출했을 경우에만 처리 (_search$$ 를 통해 전달 받음)
    //     const stataions$ = this.createStation$(search$);
    //     const marker$ = this.createMarker$(stataions$);
    //     const markerClick$ = this.createMarkerClick$(marker$);

    //     // stationId를 통해 해당 역을 지나가는 버스 리스트 조회 스트림
    //     return markerClick$
    //         .filter(({ marker }) => !!marker.mobileNo)
    //         .switchMap(({ id }) => Rx.Observable.ajax.getJSON(`/bus/pass/station/${id}`))
    //         .let(handleAjax("busRouteList"))
    //         .withLatestFrom(markerClick$, (buses, markerInfo) => ({
    //             ...markerInfo,
    //             buses: buses.concat()
    //         }))
    //         .do(v => console.info("[buses]", v))
    //         .finally(v => console.info("[finally-buses]", v))
    // }

    // infowindow에 표기할 정류소를 지나가는 버스들 표시
    render({ stationId, stationName, buses}) {
        let list = buses.map(bus => (`<dd>
                <a href="#${bus.routeId}_${bus.routeName}_${stationId}">
                    <strong>${bus.routeName}</strong> <span>${bus.regionName}</span> <span class="type ${getBuesType(bus.routeTypeName)}">${bus.routeTypeName}</span>
                </a>
            </dd>`)).join("");

        return `<dl class="bus-routes">
            <dt><strong>${stationName}</strong></dt>${list}
        </dl>`;
    }
}