### Vue 基
- el = mount 挂载目标，告诉 Vue：把你的模板、数据、指令，渲染到页面哪一个 DOM 盒子里面去。
### 简易 Vue el 挂载？
```js
//1. class 的基本用法 继承 和 类型约束 implements
//2. class 的修饰符 readonly只能给属性用  private  protected public 
//3. super 原理
//4. 静态方法
//5. get set
//private 只能在内部使用
//protected 给子类和内部去使用
//public 哪里都能用
/**
 * Options接口：约束new Vue({ ... })传入的配置对象有哪些字段、什么类型
 * el: '#app' | el: document.getElementById('app')!
*/
interface Options {
    el:string | HTMLElement
}

// VueClass接口：用来约束 class Vue 这个类必须具备哪些属性、哪些方法
interface VueClass {
    options:Options;
    init():void;
}

// TODO extends: 继承
interface Vnode {
    tag:string //div section header
    text?:string //输入的文字
    children?:Vnode[] //子集？这里有递归的意味
}
//虚拟 DOM 简单版
class Dom {
    //创建节点方法
    createElement(el:string){
        return document.createElement(el)
    }
    //填充文本方法
    setText(el:HTMLElement,text:string | null){
        el.textContent = text
    }
    //渲染函数：为了让子类能够调取父类的 render 方法
    render(data:Vnode){
        let root = this.createElement(data.tag)
        if(data.children && Array.isArray(data.children)){
            data.children.forEach(item=>{
                //递归不停地渲染有child 的节点
                let child = this.render(item)
                root.appendChild(child)
            })
        }else{
            //无 child,填充文本
            if(data.text !== undefined){
                this.setText(root, data.text)
            }
        }

        return root //FIXME 返回之后好像有递归的操作？
    }
}
// class Vue implements VueCls
// TODO implements：用于约束 class 类的 || 虽然我记得在 java 中是实现
class Vue extends Dom implements VueClass{
    options:Options;
    constructor(options:Options) {
        //FIXME ? 好像如果写了 extends 就要写 super？
        super()
        this.options = options;
    }
    init():void {
        //虚拟 dom 就是通过 js 去渲染真实 Dom
        let data:Vnode = {
            tag:'div',
            children:[
                {
                    tag:'section',
                    text:'我是子节点1'
                },
                {
                    tag:'section',
                    text:'我是子节点2'
                }
             ]
        }
        //由于联合类型？所以要判断一下，不然会滥用
        let app = typeof this.options.el === 'string' ? document.querySelector(this.options.el) : (this.options.el)
        //把真实的 Dom 节点塞进去即可
        // 如果选择器没有找到元素，提前给出明确错误
        if (!app) {
            throw new Error(`没有找到挂载元素：${this.options.el}`)
        }
        app.appendChild(this.render(data))
    }
}

// new Vue，传入配置对象，el:"#app"( 就是告诉Vue挂载到id=app的div )
//TODO 然后底下的这个 el:xxx 就是 options
const vm = new Vue({
    el:'#app',
});
vm.init();

// 手动调用初始化，模拟Vue内部自动执行init
```

### 简易 Ref？
```js
class Ref {
    _value:any //还没学泛型，按理说有多种类型都可以
    constructor(value:any) {
        this._value=value;
    }
    //✅ 行为完全就是 get /set 访问器设计出来的效果，不是 bug。👇🔗
    //https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/get
    get value() {
        return this._value + '拦截get'
    }
    set value(newValue:any) {
        this._value = newValue + '拦截set\n'
    }
}

const ref = new Ref('666\n')

//读取值操作被 get 方法拦截了
console.log(ref.value) //✅ 调用 get value()

ref.value = '我要改了\n'
console.log(ref.value)
```