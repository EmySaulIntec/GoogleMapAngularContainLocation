

import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import axios from 'axios'
export class ActiveRectangle extends google.maps.Rectangle {
  name: string
  fillColor: string
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements AfterViewInit {
  @ViewChild("mapContainer", { static: false }) gmap: any;
  map: any;
  marker: any;
  zoneName: string;
  rectangles: Array<ActiveRectangle> = []

  mapOptions: google.maps.MapOptions = {
    center: { lat: 18.56669436307344, lng: -69.7255676190758 },
    zoom: 9
  };


  ngAfterViewInit(): void {
    this.mapInitializer();
  }

  mapInitializer(): void {
    this.map = new google.maps.Map(this.gmap.nativeElement, this.mapOptions);
    this.loadRectangles()
  }

  addRectangle(): void {
    const rectangle = this.createRectangle(this.zoneName, "#" + Math.floor(Math.random()*16777215).toString(16), 
    this.map.getBounds())
    this.zoneName = ""
    this.rectangles.push(rectangle)
  }
  saveRectangles(): void {
    const result : any = this.rectangles.map(rect => {
      const bound : any = this.getBoundsFromRectangle(rect)
      return { 
        name: rect.name,
        fillColor: rect.fillColor, 
        bound_north: bound.north,
        bound_east: bound.east,
        bound_south: bound.south,
        bound_west: bound.west
      } 
    })
    axios.patch("/api/zone", 
      {
        "params": {
            "zones": result
        }
    }
    ).then(x => {
      alert("Guardado")
    })
  }
  loadRectangles(): void {
      axios.get("/api/zone").then((response: any) => {
        console.log("response:::::: ", response)
        response.data.result.data.forEach((rec) => {
          this.rectangles.push(this.createRectangle(rec.name, rec.fillColor, {
            north: rec.bound_north,
            east: rec.bound_east,
            south: rec.bound_south,
            west: rec.bound_west
          }))
        })
      })
  }
  
  createRectangle(name: string,fillColor, bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral): ActiveRectangle {
    const rectangle = new ActiveRectangle({
      bounds: bounds,
      editable: true,
      draggable: true,
      fillColor: fillColor
    }); 
    rectangle.name = name
    rectangle.fillColor = fillColor
    rectangle.setMap(this.map);
    const currentThis = this
    rectangle.addListener("bounds_changed", () => {
      const newBounds = currentThis.getBoundsFromRectangle(rectangle)
      console.log(newBounds)
    });
    return rectangle
  }
  getBoundsFromRectangle(rectangle: ActiveRectangle): google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral {
    const ne = rectangle.getBounds().getNorthEast();
    const sw = rectangle.getBounds().getSouthWest();
    const newBounds = {
      north: ne.lat(),
      east: ne.lng(),
      south: sw.lat(),
      west: sw.lng(),
    }
    return newBounds
  }
  createMarker (): void {
    if (this.marker)  {
      this.marker.setMap(null);
      this.marker = null
      return;
    }

    this.marker = new google.maps.Marker({
      map: this.map,
      position: new google.maps.LatLng(this.map.getCenter().lat(), this.map.getCenter().lng()),
      draggable: true,
      icon: '/custom_web/static/assets/images/camion40X24.png'
    });
    const currentThis = this
    google.maps.event.addListener(this.marker, 'dragend', function(event){
      const latLng = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng())
      currentThis.rectangles.forEach((rectangle) => {
       const result = rectangle.getBounds().contains(latLng)
        if (result) alert("Esta dentro de un rectangulo")
      })
  });
  }
  deleteRectangle(rectangle, index) {
    rectangle.setMap(null);
    this.rectangles.splice(index, 1)
  }
}
