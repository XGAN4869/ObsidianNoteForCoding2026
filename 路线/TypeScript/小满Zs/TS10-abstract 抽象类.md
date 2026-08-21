```js
//TODO 基类 抽象类 用的不多
//TODO 很重要！！ : 后面必须放 类型 e,g (interface、stirng, boolean...)
//abstract 定义的抽象类(仅仅描述，不能实现)
//抽象类不能被实例化，因为没有意义

abstract class Vue {
    //没加 abstract 可以实现
    name: string | undefined
    constructor(name?:string) {
        this.name = name
    }
    getName():string | undefined {
        console.log('this的构造函数名字：', this.constructor.name)
        console.log(this.name)
        return this.name
    }
    abstract init(name:string):void
}

//TODO 所以要做一个派生类，继承抽象类去实例化，并且派生类需要去实现抽象类的方法
/**
 * abstract class 抽象类：
 * 可以拥有普通属性、普通构造器、普通方法；
 * 唯独被 abstract标记的方法，没有实现，强制子类必须重写实现。
 * abstract 不能用来修饰属性（TS 可以abstract name:string，但你这里没有）。
 *
 * 继承关系 extends
 * 只要是继承关系，就是子类能用父类上的属性和方法
 *
 * this 相关
 * this 永远指向实例对象，是子类的 this 实例上，会把父类的成员初始化上去
*/
class React extends Vue {
    constructor() {
        // 仅仅是执行父类的构造函数逻辑，它不会把 this 变成父类对象；
        super();
    }
    init(name:string) {}
    setName(name:string) {
        this.name = name;
    }
}

const react = new React()
react.setName('Zora')
react.getName()
```