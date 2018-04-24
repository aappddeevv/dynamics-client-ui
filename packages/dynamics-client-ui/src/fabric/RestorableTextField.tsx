import * as React from "react"
import { DefaultButton } from "office-ui-fabric-react/lib/Button"
import { TextField } from "office-ui-fabric-react/lib/TextField"
import cx = require("classnames")

export interface RestorableTextFieldProps {
    className?: string
    label: string
    initialValue: string
    /** null => valid, otherwise error message */
    validate?: (value: string) => string | null
    onChanged?: (value: string) => void
}

export interface RestorableTextFieldState {
    value: string
}

export class RestorableTextField extends React.Component<RestorableTextFieldProps,
    RestorableTextFieldState> {
    constructor(props: RestorableTextFieldProps) {
        super(props)
        this.state = {
            value: props.initialValue
        }
    }

    public render(): JSX.Element {
        return (
            <div className={cx("NumberTextField", this.props.className)}>
                <TextField
                    className='NumberTextField-textField'
                    label={this.props.label}
                    value={this.state.value}
                    onChanged={this.onChanged}
                    onGetErrorMessage={this.validate}
                />
                <div className='NumberTextField-restoreButton'>
                    <DefaultButton onClick={this.restore}>
                        Restore
                    </DefaultButton>
                </div>
            </div>
        )
    }

    private validate = (value: string): string => {
        if (this.props.validate) {
            const rval = this.props.validate(value)
            return rval ? rval : ""
        }
        return ""
    }

    private onChanged = (value: string): void => {
        this.setState({
            value
        })
        if (this.props.onChanged) this.props.onChanged(value)
    }

    private restore = (): void => {
        this.setState({
            value: this.props.initialValue
        })
    }
}

/** Validate number with `isNan`. */
export class NumberTextField extends React.Component<RestorableTextFieldProps, any> {
    constructor(props: RestorableTextFieldProps) {
        super(props)
    }

    public render(): JSX.Element {
        return (
            <RestorableTextField
                {...this.props}
                validate={this.validateNumber}
            />
        )
    }

    private validateNumber(value: string): string {
        return isNaN(Number(value))
            ? `The value should be a number, actual is ${value}.`
            : ''
    }
}
