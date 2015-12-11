'use strict';

class Point {
    constructor(options) {
        if(options.map) this.map = options.map;
        if(options.elem) {

            this.elem = options.elem;
            this.elem.addEventListener('input', () => { this._renderHandler(); });
        }
    }

    _renderHandler() {
        let ctx = this;
        this.input_value = this.elem.value;
        ymaps.geocode(this.input_value, {
            results: 1
        }).then(function (res) {
            ctx.clear();
            ctx.coords = res.geoObjects.get(0).geometry.getCoordinates();
            ctx.placemark =  new ymaps.Placemark(ctx.coords, {
                iconContent: 'A',
                balloonContent: ctx.input_value
            }, {
                preset: 'islands#violetStretchyIcon',
                draggable: true
            });
            ctx.add();

        }, function(err) {
            console.log('Point error');
        });


    }

    add() {
        //debugger;
        this.map.geoObjects.add(this.placemark);
        this.index = this.map.geoObjects.getLength() - 1;
    }

    clear() {
        if(!this.index) return;
        this.map.geoObjects.remove(this.map.geoObjects.get(this.index));
    }
}

let myMap;
ymaps.ready(init);

function init() {
    myMap = new ymaps.Map('map', {
        center: [59.95, 30.2],
        zoom: 10
    }, {
        searchControlProvider: 'yandex#search'
    });

    let start_elem = document.getElementById('ts_route_start');
    let end_elem = document.getElementById('ts_route_finish');

    let startP = new Point({
        map: myMap,
        elem: start_elem
    });




}