export const effect = (fn: Function, option: object = {}): void => {
    console.log('init project');    
    fn && fn()
}