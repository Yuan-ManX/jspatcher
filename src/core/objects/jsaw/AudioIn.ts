import BaseObject from "../base/BaseObject";
import type { IArgsMeta, IOutletsMeta, IPropsMeta } from "../base/AbstractObject";
import type { PatcherEventMap } from "../../patcher/Patcher";

interface P {
    description: string;
}

export default class AudioIn extends BaseObject<{}, {}, [], [Float32Array], [number], P> {
    static isPatcherInlet = "audio" as const;
    static description = "Patcher inlet (audio)";
    static args: IArgsMeta = [{
        type: "number",
        optional: false,
        default: 1,
        description: "Inlet index (1-based)"
    }];
    static props: IPropsMeta<P> = {
        description: {
            type: "string",
            default: "",
            description: "Description text"
        }
    };
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "Float32Array buffer"
    }];
    protected get index() {
        return Math.max(1, ~~this.box.args[0] || 1);
    }
    protected _ = { index: this.index };
    protected handlePatcherInput = ({ input, buffer }: PatcherEventMap["audioInput"]) => {
        if (input === this.index - 1) this.outlet(0, buffer);
    };
    protected emitPatcherChangeIO = () => this.patcher.changeIO();
    subscribe() {
        super.subscribe();
        this.on("metaUpdated", this.emitPatcherChangeIO);
        this.on("preInit", () => {
            this.inlets = 0;
            this.outlets = 1;
        });
        this.on("postInit", this.emitPatcherChangeIO);
        this.on("updateArgs", () => {
            const { index } = this;
            if (index !== this._.index) {
                this._.index = index;
                this.patcher.changeIO();
            }
        });
        this.on("updateProps", (props) => {
            const outlet0 = { ...this.meta.outlets[0] };
            if (typeof props.description === "string") outlet0.description = props.description;
            this.setMeta({ outlets: [outlet0] });
            this.emitPatcherChangeIO();
        });
        if (this.env.thread === "AudioWorklet") this.patcher.on("audioInput", this.handlePatcherInput);
        this.on("destroy", () => {
            this.patcher.off("audioInput", this.handlePatcherInput);
            this.patcher.changeIO();
        });
    }
}
