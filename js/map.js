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
        this.collection = this.map.geoObjects;
        this._startEditing = false;
        this._isButtonListening = false;
        this.render();
    }

    render() {
        let ctx = this;
        let coords = [];

        if(this.points) {
            this.points.each(function (elem, i) {
                coords[i] = elem.geometry.getCoordinates();
            });

        } else {
            coords.push(this.pointA.geometry.getCoordinates());
            coords.push(this.pointB.geometry.getCoordinates());
        }

        ymaps.route(coords)
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
        let editButton = document.getElementById('editor');
        let ctx = this;

        this.collection.add(this.route);

        if(!this._isButtonListening) {
            editButton.addEventListener('click', () => {
                if (this._startEditing = !this._startEditing) {
                    this.route.editor.start({ addWayPoints: true });
                    editButton.value = 'Отключить редактор маршрута';
                } else {
                    this.route.editor.stop();
                    editButton.value = 'Включить редактор маршрута';
                }
            });
            this._isButtonListening = true;
        }

        this.points = this.route.getWayPoints();
        let lastPoint = this.points.getLength() - 1;

        this.points.options.set('preset', 'islands#redStretchyIcon');
        this.points.options.set('draggable', 'true');

        //this.pointA = this.points.get(0);
        //this.pointB = this.points.get(lastPoint);

        this.points.each( function(elem) {
            elem.events.add('dragend', (e) => ctx.onChange(e));
        });


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
    let isRouterInitialized = false;


    let startP = new PlaceMark({
        map: myMap,
        elem: start_elem,
        content: 'A'
    });

    let endP = new PlaceMark({
        map: myMap,
        elem: end_elem,
        content: 'B'
    });

    myMap.geoObjects.events.add('add', (e) => {
        if(isRouterInitialized) return;
        isRouterInitialized = createRouter(e, myMap, startP, endP);
    });
}


function createRouter(e, map, pointA, pointB, ...interPoints) {
    let target = e.get('target');
    let last_added = target.get(target.getLength() - 1);
    if(!last_added.geometry) return false;

    if(!pointA.coords || !pointB.coords) return false;

    let router = new Router({
        map: map,
        pointA: pointA.placemark,
        pointB: pointB.placemark
    });

    return true;

}