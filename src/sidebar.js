import { parseHash } from "./common.js";
export default class Sidebar {
    constructor($sidebar) {
        this.$sidebar = $sidebar;
        this.$list = $sidebar.querySelector("ul");
        this.$title = $sidebar.querySelector(".title");
    }
    render(stations) {
        // list에 표기할 버스가 지나가는 정류소들 표시
        const {
            routeNum
        } = parseHash();
        this.$title.innerHTML = `${routeNum} 버스 노선`;  
        this.$list.innerHTML = stations.map(station => {
            return `<li>
                <div class="line">
                    <span class="line_detail"></span>
                    <span class="direction">
                        <i class="fas fa-chevron-circle-down"></i>
                    </span>
                </div>
                <div class="text">
                    <strong>${station.stationName}</strong>
                </div>
            </li>`;
        }).join("");
        this.$sidebar.style.display = "block";
    }
    close() {
        this.$sidebar.style.display = "none";
    }
};
