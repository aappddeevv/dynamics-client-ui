import * as React from "react"
import * as PropTypes from "prop-types"
//import {getContext, InferableComponentEnhancerWithProps} from "recompose"

import * as Utils from "./Utils"
import { NotificationManager, Notifier } from "./NotificationManager"
import { ConsoleErrorHandler, ErrorHandler } from "./ErrorHandler"
import { XRM } from "./xrm"
import { getXrmP } from "./getXrmP"
export * from "./NotificationManager"

export interface DynamicsContext {
    xrmP: Promise<XRM>
    xrm: XRM | null
    notifier: Notifier
    errorHandler: ErrorHandler
}

export interface DynamicsProps {
    xrm?: XRM | null
    notifier?: Notifier
    errorHandler?: ErrorHandler
}

/** Not used yet. */
export const dynamicsShape = PropTypes.shape({
    notifier: PropTypes.object,
    xrm: PropTypes.object,
    errorHandler: PropTypes.object,
})

/**
 * Render the first child only. Places Xrm and a NotificationManager into the context.
 * Declare a child's use of the context:
 * ```
 * class Foo extends React.Component {
 *  public static contextTypes = {
 *        Xrm: PropTypes.object, // can use isRequired
 *        notifier: PropTypes.instanceOf(Object) // can use isRequired
 *  }
 *  constructor(props, context) {
 *   super(props, context);
 *   ...
 *  }
 * ...
 * ```
 * You can access the context using `this.context.notifier.add(..)`. Instead of retyping
 * the contextTypes in the child, you can use `public static contextTypes { ...Dynamics.childContextTypes }`.
 *
 * The component is stateless as only the children define the render.
 *
 * TODO: Notifier only works on forms, make more general so it works in non-forms.
 */
export class Dynamics<P extends DynamicsProps=DynamicsProps, S={}> extends React.Component<P, S> {

    constructor(props: P, context: any) {
        super(props, context)
    }

    private getXrmP = getXrmP()
    private defaultErrorHandler: ErrorHandler = new ConsoleErrorHandler()
    private defaultNotifier: Notifier = new NotificationManager(() => this.getXrm())

    public getChildContext(): DynamicsContext {
        return {
            xrmP: this.getXrmP,
            notifier: this.notifier,
            xrm: this.getXrm(),
            errorHandler: this.errorHandler,
        }
    }

    /** Get Xrm from the props or the global environment window.parent. */
    protected getXrm = (): XRM | null => {
        if (this.props &&
            typeof this.props.xrm !== "undefined" && this.props.xrm !== null)
            return this.props.xrm!
        return Utils.getXrm()
    }

    get notifier(): Notifier {
        return (this.props && this.props.notifier) ?
            this.props.notifier! as Notifier :
            this.defaultNotifier
    }

    get errorHandler(): ErrorHandler {
        return this.props.errorHandler ?
            (this.props.errorHandler as ErrorHandler) :
            this.defaultErrorHandler
    }

    public static childContextTypes = {
        notifier: PropTypes.object,
        xrm: PropTypes.object,
        xrmP: PropTypes.func,
        errorHandler: PropTypes.object,
    }

    public render() {
        const { children } = this.props;
        return React.Children.only(children)
    }
}

/**
 * Use this to compose your component with Xrm and NotificationManager
 * in the props.
 *
 * ```
 * const YourComponent = ({notificationManager, Xrm, ...rest}) => {
 *   console.log(notifier, Xrm); // to prove that it is there.
 * }
 * export default withDynamics(YourComponent)
 * ```
 */
/* export const withDynamics = getContext(
 *     {
 *         notifier: PropTypes.instanceOf(NotificationManager),
 *         xrm: PropTypes.object,
 *         errorHandler: PropTypes.object
 *     }
 * )
 * */
export default Dynamics

export const createDynamicsContext = (props?: Partial<DynamicsContext>): DynamicsContext => {
    const x = Utils.getXrm()
    return {
        xrmP: getXrmP(),
        xrm: x,
        errorHandler: new ConsoleErrorHandler(),
        notifier: new NotificationManager(() => this.getXrm()),
        ...props,
    }
}

/**
 * Dynamics context that uses r16.3 context API.
 */
export const DynamicsReactContext = React.createContext<DynamicsContext>(createDynamicsContext())
