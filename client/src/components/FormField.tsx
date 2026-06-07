type FieldProps = {
    label: string
    required?: boolean
    children: React.ReactNode
}

export function Field({ label, required, children }: FieldProps) {
    return (
        <label className="FormField">
            <span className="FormFieldLabel">
                {label} {required ? <span className="FormFieldRequired">*</span> : null}
            </span>
            {children}
        </label>
    )
}

type LineFieldColProps = {
    label: string
    required?: boolean
    className?: string
    title?: string
    children: React.ReactNode
}

export function LineFieldCol({ label, required, className, title, children }: LineFieldColProps) {
    return (
        <label className={`LineFieldCol ${className ?? ''}`} title={title}>
            <span className="LineFieldLabel">
                {label} {required ? <span className="FormFieldRequired">*</span> : null}
            </span>
            {children}
        </label>
    )
}