import {handleAjax} from "./common.js";

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
    // 지도 위에 표시되는 정보창(infowindow)을 보여준다.
    // 이때 대상 마커 인스턴스와 정보창에 보여줄 내용, 그리고 정보창이 보여질 위치 정보를 전달한다.
    openInfoWindow(marker, position, content) {
        this.naverMap.panTo(position, { duration: 300 });
        this.infowindow.setContent(content);
        this.infowindow.open(this.naverMap, marker);
    }
    // 지도 위에 표시되는 정보창(infowindow)을 닫는다.
    closeInfoWindow() {
        this.infowindow.close();
    }
    
    // 전달된 위치 정보에서 정보창림을 보여줘야하는 지(true) 감춰야하는지(false) 여부를 반환한다.
    isOpenInfoWindow(position) {
        return !(position.equals(this.infowindow.getPosition()) && this.infowindow.getMap());
    }
    // constructor($map, search$) {
    constructor($map) {
        this.naverMap = createNaverMap($map);
        this.infowindow = createNaverInfoWindow();
        
        const station$ = this.createDragend$()
            .let(this.mapStation)
            .let(this.manageMarker.bind(this))
            .let(this.mapMarkerClick)
            .let(this.mapBus)

        station$
            .subscribe(({ markerInfo, buses}) => {
                if (this.isOpenInfoWindow(markerInfo.position)) {
                    this.openInfoWindow(
                        markerInfo.marker,
                        markerInfo.position,
                        this.render(buses, markerInfo)
                    );
                } else {
                    this.closeInfoWindow();
                }
            })
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
            .switchMap(markerInfo => {
                const marker$ = Rx.Observable.of(markerInfo);
                const bus$ = Rx.Observable.ajax.getJSON(`/bus/pass/station/${markerInfo.id}`)
                    .let(handleAjax("busRouteList"));
                return marker$.combineLatest(bus$, (marker, buses) => ({
                    buses,
                markerInfo
            }));
        });
    }
    mapStation(coord$) {
        return coord$.switchMap(coords => Rx.Observable.ajax.getJSON(`/station/around/${coords.longitude}/${coords.latitude}`))
            .let(handleAjax("busStationAroundList"))
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
        })
    }
    render(buses, { name }) {
        const list = buses.map(bus => (`<dd>
                <a href="#${bus.routeId}_${bus.routeName}">
                    <strong>${bus.routeName}</strong> <span>${bus.regionName}</span> <span class="type ${getBuesType(bus.routeTypeName)}">${bus.routeTypeName}</span>
                </a>
            </dd>`)).join("");

        return `<dl class="bus-routes">
            <dt><strong>${name}</strong></dt>${list}
        </dl>`;
    }
}