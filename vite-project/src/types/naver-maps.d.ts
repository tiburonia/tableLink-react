declare namespace naver.maps {
  export class LatLng {
    constructor(lat: number, lng: number)
    lat(): number
    lng(): number
  }

  export class Size {
    constructor(width: number, height: number)
    width: number
    height: number
  }

  export class Bounds {
    min: LatLng
    max: LatLng
  }

  export interface MapOptions {
    center?: LatLng
    zoom?: number
    maxZoom?: number
    minZoom?: number
    mapTypeControl?: boolean
    mapTypeControlOptions?: Record<string, unknown>
  }

  export class Map {
    constructor(container: HTMLElement, options?: MapOptions)
    getCenter(): LatLng
    setCenter(location: LatLng): void
    getZoom(): number
    setZoom(zoom: number): void
  }

  export interface MarkerOptions {
    position?: LatLng
    map?: Map | null
    title?: string
    icon?: string | Record<string, unknown>
    [key: string]: unknown
  }

  export class Marker {
    constructor(options?: MarkerOptions)
    setPosition(position: LatLng): void
    setMap(map: Map | null): void
  }

  export interface InfoWindowOptions {
    content?: string | HTMLElement
    position?: LatLng
    [key: string]: unknown
  }

  export class InfoWindow {
    constructor(options?: InfoWindowOptions)
    open(map: Map, marker?: Marker): void
    close(): void
  }

  export namespace Event {
    export function addListener(
      target: Map | Marker,
      eventName: string,
      handler: (event: MouseEvent | Event) => void,
      useCapture?: boolean
    ): void
  }
}

declare const naver: {
  maps: {
    LatLng: typeof naver.maps.LatLng
    Map: typeof naver.maps.Map
    Marker: typeof naver.maps.Marker
    InfoWindow: typeof naver.maps.InfoWindow
    Size: typeof naver.maps.Size
    Bounds: typeof naver.maps.Bounds
    Event: typeof naver.maps.Event
  }
}
