import Getter from "./Getter";
import { isBang } from "../base/Bang";
import type { IJSPatcherObjectMeta } from "../base/AbstractObject";
import type { ImportedObjectType } from "../../types";

export default class StaticGetter extends Getter<true> {
    static importedObjectType: ImportedObjectType = "StaticGetter";
    static description = "Auto-imported static getter";
    static inlets: IJSPatcherObjectMeta["inlets"] = [{
        isHot: true,
        type: "bang",
        description: "Get the value"
    }];
    static outlets: IJSPatcherObjectMeta["outlets"] = [{
        type: "anything",
        description: "Value"
    }];
    handlePreInit = () => {
        this.inlets = 1;
        this.outlets = 1;
    };
    handleInlet = ({ data, inlet }: { data: any; inlet: number }) => {
        if (inlet === 0 && isBang(data) && this.execute()) this.output();
    };
    execute() {
        try {
            this._.result = this.imported;
            return true;
        } catch (e) {
            this.error(e);
            return false;
        }
    }
    callback = () => this.outlet(0, this._.result);
}
