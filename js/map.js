'use strict';

class PlaceMark {
    constructor(options) {
        if(options.map) this.map = options.map;
        this.collection = this.map.geoObjects;
        this.content = options.content || 'Точка';
        if(options.elem) {
            this.elem = options.elem;
            let suggestView = new ymaps.SuggestView(this.elem);
            suggestView.events.add('select', () => this.render());
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
        this.collection.add(this.placemark);
        this.index = this.collection.getLength() - 1;
    }

    clear() {
        //debugger;
        if(!this.index && this.index != 0) return;
        this.collection.remove(this.collection.get(this.index));
        this.index = null;
    }
}


class Router {
    constructor(options) {
        this.map = options.map;
        this.pointA = options.pointA;
        this.pointB = options.pointB;
        this.interPoints = options.points;
        this.collection = this.map.geoObjects;

        this.render();
    }

    render() {
        let ctx = this;

        let start_coords = this.pointA.geometry.getCoordinates();
        let end_coords = this.pointB.geometry.getCoordinates();

        ymaps.route([start_coords, end_coords])
            .then(
                function(route) {
                    ctx.route = route;
                    ctx.collection.removeAll();
                    ctx.add();
                },
                function(error) {
                    console.log('error: ' + error);
                }
            )
    }

    add() {
        this.collection.add(this.route);

        let points = this.route.getWayPoints(), lastPoint = points.getLength() - 1;
        points.options.set('preset', 'islands#redStretchyIcon');
        points.options.set('draggable', 'true');
        points.get(0).properties.set('iconContent', 'A');
        points.get(lastPoint).properties.set('iconContent', 'Б');

        this.pointA = points.get(0);
        this.pointB = points.get(lastPoint);

        console.log('ok');

        this.pointA.events.add('dragend', (e) => this.onChange(e));
        this.pointB.events.add('dragend', (e) => this.onChange(e));

    }

    onChange(e) {
        let thisPoint = e.get('target');
        let coords = thisPoint.geometry.getCoordinates();

        thisPoint.geometry.setCoordinates(coords);

        this.render();
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

    let startP = new PlaceMark({
        map: myMap,
        elem: start_elem,
        content: 'A',
        collection: points
    });

    let endP = new PlaceMark({
        map: myMap,
        elem: end_elem,
        content: 'B',
        collection: points
    });

    myMap.geoObjects.events.add('add', (e) => createRouter(e, myMap, startP, endP));
}


function createRouter(e, map, pointA, pointB, ...interPoints) {
    let target = e.get('target');
    let last_added = target.get(target.getLength() - 1);
    if(!last_added.geometry) return;

    if(!pointA.coords || !pointB.coords) return;

    let router = new Router({
        map: map,
        pointA: pointA.placemark,
        pointB: pointB.placemark
    });

}