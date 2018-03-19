// import { parseHash} from "./common.js";

export default class Sidebar {
    constructor($sidebar) {
        // this.$sidebar = $sidebar;
        // this.$list = $sidebar.querySelector("ul");
        // this.$title = $sidebar.querySelector(".title");
    }
    // render(stations) {
    //     // list에 표기할 버스가 지나가는 정류소들 표시
    //     const {
    //         routeNum,
    //         stationId
    //     } = parseHash();
    //     this.$list.innerHTML = stations.map(station => {
    //         const className = station.stationId === stationId ? "class='at'" : "";
    //         return `<li ${className} data-x="${station.x}" data-y="${station.y}">
    //             <div class="line">
    //                 <span class="line_detail"></span>
    //                 <span class="direction">
    //                     <i class="fas fa-chevron-circle-down"></i>
    //                 </span>
    //             </div>
    //             <div class="text">
    //                 <strong>${station.stationName}</strong>
    //                 <span>${station.mobileNo}</span>
    //             </div>
    //         </li>`;
    //     }).join("");
    //     this.$title.innerHTML = `${routeNum} 버스 노선`;
    //     this.$sidebar.style.display = "block";
    //     this.scrollTo();
    // }
    
    // scrollTo() {
    //     // 버스 노선 정류소 
    //     const at = this.$list.querySelector(".at");
    //     if (at) {
    //         at.scrollIntoView();
    //     } 
    // }
    // close() {
    //     this.$sidebar.style.display = "none";
    // }
};
