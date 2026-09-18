/*
 * Stub of the vis-2 runtime, shared by the development page (`index.html`) and the screenshot page
 * (`shots.html`).
 *
 * Importing this module puts `window.visRxWidget` in place. The widgets extend it, so they may only be imported
 * afterwards - both pages load them with a dynamic `import()` after this module.
 */
import React, { type CSSProperties } from 'react';

const camel = (attr: string): string => attr.replace(/(-\w)/g, text => text[1].toUpperCase());

class VisRxWidgetStub extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            rxData: props.rxData || {},
            data: props.rxData || {},
            rxStyle: props.rxStyle || {},
            values: props.values || {},
            editMode: !!props.editMode,
            visible: true,
        };
    }

    /** The values live in the page, not in the widget - this is what feeds them in on every change */
    static getDerivedStateFromProps(props: any, state: any): any {
        if (props.values !== state.values || props.rxData !== state.rxData || props.rxStyle !== state.rxStyle) {
            return { values: props.values, rxData: props.rxData, data: props.rxData, rxStyle: props.rxStyle || {} };
        }
        return null;
    }

    static getI18nPrefix(): string {
        return '';
    }

    componentDidMount(): void {}

    componentWillUnmount(): void {}

    componentDidUpdate(_prevProps: any, _prevState: any): void {}

    /** Like vis-2: the root gets `vis-widget`, the class of the widget and the CSS of the widget */
    renderWidgetBody(props: any): any {
        props.className = `vis-widget${this.state.rxData.class ? ` ${this.state.rxData.class}` : ''}`;
        Object.keys(this.state.rxStyle).forEach(attr => (props.style[camel(attr)] = this.state.rxStyle[attr]));
        props.style.position = 'absolute';
        return null;
    }

    render(): React.ReactNode {
        const props = { className: '', style: {} as CSSProperties, id: 'w1', widget: {}, overlayClassNames: [] };
        const body = (this as any).renderWidgetBody(props);
        return (
            <div
                className={props.className}
                style={{ ...props.style, left: 0, top: 0 }}
            >
                {body}
            </div>
        );
    }
}

(window as any).visRxWidget = VisRxWidgetStub;

/** Fills in the defaults of `getWidgetInfo()`, the way the vis editor does when a widget is created */
export function withDefaults(Widget: any, data: Record<string, any>): Record<string, any> {
    const info = Widget.getWidgetInfo();
    const result: Record<string, any> = {};
    for (const group of info.visAttrs) {
        for (const field of group.fields) {
            if (field.default !== undefined) {
                result[field.name] = field.default;
            }
        }
    }
    return { ...result, ...data };
}
