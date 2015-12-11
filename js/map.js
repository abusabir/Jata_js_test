'use strict';

class Point {
    constructor(options) {
        if(options.map) this.map = options.map;
        this.content = options.content || 'Точка';
        if(options.elem) {
            this.elem = options.elem;
            let suggestView = new ymaps.SuggestView(this.elem);
            suggestView.events.add('select', () => this.render());
            //this.elem.addEventListener('change', (e) => { this.render(e); });
        }
    }

    render() {
        let ctx = this;
        if(this.input_value == this.elem.value) return;
        this.input_value = this.elem.value;
        ymaps.geocode(this.input_value, {
            results: 1
        }).then(function (res) {
            ctx.clear();
            ctx.coords = res.geoObjects.get(0).geometry.getCoordinates();
            ctx.placemark =  new ymaps.Placemark(ctx.coords, {
                iconContent: ctx.content,
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
        this.map.geoObjects.add(this.placemark);
        this.index = this.map.geoObjects.getLength() - 1;
    }

    clear() {
        //debugger;
        if(!this.index && this.index != 0) return;
        this.map.geoObjects.remove(this.map.geoObjects.get(this.index));
        this.index = null;
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

    let points = new ymaps.GeoObjectCollection();

    let startP = new Point({
        map: myMap,
        elem: start_elem,
        content: 'A',
        collection: points
    });

    let endP = new Point({
        map: myMap,
        elem: end_elem,
        content: 'B',
        collection: points
    });

    myMap.geoObjects.events.add('add', (e) => router(e, myMap, startP, endP));
}


function router(e, map, pointA, pointB, ...interPoints) {
    let target = e.get('target');
    let last_added = target.get(target.getLength() - 1);

    if(!last_added.geometry) return;

    ////console.dir(target.get(map.geoObjects.getLength() - 1).geometry.getType());
    //let arr = map.geoObjects.toArray();

    if(!pointA.coords || !pointB.coords) return;
    let start_coords = pointA.coords;
    let end_coords = pointB.coords;
    ymaps.route([start_coords, end_coords])
        .then(
            function(route) {
                console.log('ok');
                map.geoObjects.add(route);
            },
            function(error) {
                console.log('error: ' + error);
            }
        )
}