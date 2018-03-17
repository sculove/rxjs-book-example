import Map from "./map.js";
import Sidebar from "./sidebar.js";
import AutoComplete from "./autocomplete.js";
import {createShare$} from "./common.js";

const {
    render$,
    search$
} = createShare$();

const search = new AutoComplete(document.querySelector(".autocomplete"));
const map = new Map(
    document.querySelector(".map"),
    search$
);
const sidebar = new Sidebar(document.querySelector(".stations"));

// subscribe
render$
    .do(v => console.warn("===> render", v))
    .subscribe(stations => {
        if (stations.length) {
            sidebar.render(stations);
            map.drawPath(stations)
        } else {
            sidebar.close();
            map.deletePath();
        }
    });
search$
    .do(v => console.warn("===> search from share", v))
    .subscribe(coord => map.setCenter(coord))

