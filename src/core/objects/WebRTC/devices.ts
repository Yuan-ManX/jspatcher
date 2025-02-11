import { StrictDropdownItemProps } from "semantic-ui-react";
import { Bang, isBang } from "../base/index.jspatpkg";
import { DefaultWebRTCObject } from "./Base";
import { IJSPatcherObjectMeta, IPropsMeta } from "../../types";

export class mediaDevices extends DefaultWebRTCObject<{}, {}, [Bang | MediaDeviceKind[]], [MediaDeviceInfo[], StrictDropdownItemProps[]], MediaDeviceKind[], { autoUpdate: boolean }> {
    static description = "Enumerate media devices";
    static inlets: IJSPatcherObjectMeta["inlets"] = [{
        isHot: true,
        type: "object",
        description: "Bang to enumerate, MediaDeviceKind[] to use a filter"
    }];
    static outlets: IJSPatcherObjectMeta["outlets"] = [{
        type: "object",
        description: "Array of MediaDeviceInfo"
    }, {
        type: "object",
        description: "Array of DropdownItemProps"
    }];
    static args: IJSPatcherObjectMeta["args"] = [{
        type: "enum",
        varLength: true,
        optional: true,
        enums: ["audioinput", "audiooutput", "videoinput"],
        default: ["audioinput", "audiooutput", "videoinput"],
        description: "Output only kinds of devices"
    }];
    static props: IPropsMeta<{ autoUpdate: boolean }> = {
        autoUpdate: {
            type: "boolean",
            default: true,
            description: "Auto output devices when devices change"
        }
    };
    handleDeviceChange = async () => {
        if (!this.getProp("autoUpdate")) return;
        const filters = this.box.args.slice();
        if (!filters.length) filters.push("audioinput", "audiooutput", "videoinput");
        const devices = await navigator.mediaDevices.enumerateDevices();
        const options = devices.filter(d => filters.indexOf(d.kind) !== -1).map((d, key) => {
            const { kind, deviceId, label } = d;
            return { key, icon: { audioinput: "microphone", audiooutput: "volume up", videoinput: "camera" }[kind], text: label || deviceId, value: deviceId };
        });
        this.outletAll([devices, options]);
    };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
        });
        this.on("postInit", () => {
            navigator.mediaDevices.addEventListener("devicechange", this.handleDeviceChange);
            if (this.getProp("autoUpdate")) this.handleDeviceChange();
        });
        this.on("inlet", async ({ data, inlet }) => {
            if (inlet === 0) {
                let filters: MediaDeviceKind[];
                if (isBang(data)) {
                    filters = this.box.args.slice();
                    if (!filters.length) filters.push("audioinput", "audiooutput", "videoinput");
                } else {
                    filters = data.slice();
                }
                const devices = await navigator.mediaDevices.enumerateDevices();
                const options = devices.filter(d => filters.indexOf(d.kind) !== -1).map((d, key) => {
                    const { kind, deviceId, label } = d;
                    return { key, icon: { audioinput: "microphone", audiooutput: "volume up", videoinput: "camera" }[kind], text: label || deviceId, value: deviceId };
                });
                this.outletAll([devices, options]);
            }
        });
        this.on("destroy", () => {
            navigator.mediaDevices.removeEventListener("devicechange", this.handleDeviceChange);
        });
    }
}
