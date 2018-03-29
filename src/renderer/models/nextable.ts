import {Subject} from "rxjs";

export interface Channel {
  up: Subject<any>;
  down: Subject<any>;
}
