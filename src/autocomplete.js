import {handleAjax} from "./common.js"

export default class AutoComplete {
  constructor($autocomplete) {
    this.$input = $autocomplete.querySelector("input");
    this.$layer = $autocomplete.querySelector(".layer"); 
    this.$loading = $autocomplete.querySelector(".loading");
    
    let [search$, reset$] = this.createKeyup$().partition(query => query.trim().length > 0);

    // 검색어가 입력된 경우
    search$ = search$
      .do(() => this.showLoading())
      .switchMap(query => Rx.Observable.ajax.getJSON(`/bus/${query}`))
      .let(handleAjax("busRouteList"))
      .retry(2)
      .do(() => this.hideLoading())
      .finally(() => this.reset());

    // 검색 결과를 초기화하는 경우
    reset$ = reset$.merge(Rx.Observable.fromEvent(this.$layer, "click", (evt) => evt.target.closest("li")));

    reset$.subscribe(() => this.reset());
    search$.subscribe(items => this.render(items));
  }
  createKeyup$() {
    return Rx.Observable
      .fromEvent(this.$input, "keyup")
      .debounceTime(300)
      .map(event => event.target.value)
      .distinctUntilChanged()
      .share();
  }
  showLoading() {
    this.$loading.style.display = "block";
  }
  hideLoading() {
    this.$loading.style.display = "none";
  }
  reset() {
    this.hideLoading();
    this.$layer.style.display = "none";
  }
  render(buses) {
    this.$layer.innerHTML = buses.map(bus => {
      return `<li>
        <a href="#${bus.routeId}_${bus.routeName}">
          <strong>${bus.routeName}</strong>
          <span>${bus.regionName}</span>
          <div>${bus.routeTypeName}</div>
        </a>
      </li>`;
    }).join("");
    this.$layer.style.display = "block";
  }
};
