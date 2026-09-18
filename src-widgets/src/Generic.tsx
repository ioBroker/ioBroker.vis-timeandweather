import type { VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

/**
 * Base class of every time and weather widget.
 *
 * `window.visRxWidget` is provided by the vis-2 runtime, so the widget set is built against the react copy of the
 * host instead of shipping its own.
 */
export default class Generic<
    RxData extends Record<string, any>,
    State extends Partial<VisRxWidgetState> = VisRxWidgetState,
> extends (window.visRxWidget as typeof VisRxWidget)<RxData, State> {
    static getI18nPrefix(): string {
        return 'vis_timeandweather_';
    }

    /**
     * Class of the widget content. In the dark theme of vis-2 it carries `tw-rx-dark`, which switches the CSS
     * variables of `styles.css` - only what lies on the view follows the theme, the faces of the clocks do not.
     */
    getRootClass(extra?: string): string {
        const cls = this.props.context.themeType === 'dark' ? 'tw-rx tw-rx-dark' : 'tw-rx';
        return extra ? `${cls} ${extra}` : cls;
    }

    /** Language of the vis-2 runtime */
    getLanguage(): ioBroker.Languages {
        return this.props.context.lang || 'en';
    }
}
