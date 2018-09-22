# FreeTextarea 使用指南

> Author Cliven 2018-9-19 22:59:45

## 功能简述

FreeTextarea 能够在页面中生成自定义的`textarea`可以提供输入文字和提取输入文字的功能。并且可以用过点击拖拽的方式移动已经创建的textarea的位置。

可以创建多个`textarea`对象在页面中，创建的`textarea`将会以绝对路径的方式插入页面中，在生成的dom上面点击右键就能够弹出删除菜单，删除对应的`textarea`。

> 也可以指定注册对象，来限制只有在对象内有插件有效。

## QuickStart

将脚本引入页面中
```html
<script src="freeTextarea.js"></script>
```

引入文件后，将会在全局变量注册名为`TxtAreaBox`插件，初始化插件
```html
<canvas id="canvas"></canvas>
```

```javascript
var canvas = document.getElementById("canvas");
FreeTextarea.init(canvas, "free");
```

> `canvas` 可替换为需要注册的dom对象

获取已经创建所有的文本框

```javascript
var nodes = FreeTextarea.getAllNode();
for(var i = 0, len = nodes.length; i < len; i++){
    console.log(nodes[i].id, nodes[i].getContent());
}
```


---

手动创建一个`textarea`
```javascript
FreeTextarea.add("textArea_dom_id", {
    coord: {
        clientX: 555,
        clientY: 120
    },
    height: '100px',
    width: '500px',
    fontSize: '15px'
});
```

删除一个textarea
```javascript
FreeTextarea.removeById("textArea_dom_id");
```

获取一个`TextAreaNode`对象
```javascript
var node = FreeTextarea.findById("textArea_dom_id");
```


## API

### `TextAreaNode`

`TextAreaNode` 是`textarea`的封装对象，用于操作和控制已经创建的`textarea`，创建的`textarea`都是一个DOM对象在文档流中意绝对坐标的方式存在。

每个`textarea`都有一个唯一的ID用于识别和存储。

#### 对象属性

> 如果需要获取下面参数的数值类型，请通过`getXXX()`的方法获取，如果需要设置新的值请使用`setXXX(newVal)`

- `id` {String} 对象ID
- `left` {String} 绝对定位的left坐标（附带单位的字符串如 `35px`）
- `top` {String} 绝对定位的top坐标 （附带单位的字符串如 `35px`）
- `fontSize` {String} textarea文本框中的字体大小（附带单位的字符串如 `35px`）
- `width` {String} textarea的宽度（附带单位的字符串如 `35px`）
- `height` {String} textarea的高度（附带单位的字符串如 `35px`）
- `relativeOffset` {Object} `{relativeX: number, relativeY: number}` 相对于注册DOM对象内部的坐标
- `dom` {Object}创建的`textarea`DOM对象。
- `isDragInMoving` {Boolean} 标识dom是否处于拖拽中 
- `isFocusing` {Boolean} 标识对象是否获得到焦点
- `lastCoordinate` {Object} `{clientX: number, clientY: number}` 上次拖拽时的坐标

##### `movePosition(dx, dy)`

移动textarea对象

- `dx` x方向上的移动量
- `dy` y方向上的移动量

##### `getDom()`

获取`textarea`对应的dom对象

返还值

`textarea` dom对象

##### `setId(newVal)`

对`textarea` 封装对象设置新的ID，会改变dom的ID

- `newVal` {String} 新的ID

##### `setLeft(newVal)`

对`textarea` 封装对象设置新的left，会改变dom的位置

- `newVal` {Number} 新的X轴方向绝对位置

##### `setTop(newVal)`

对`textarea` 封装对象设置新的top，会改变dom的位置

- `newVal` {Number} 新的Y轴方向绝对位置


##### `setWidth(newVal)`

对`textarea` 封装对象设置新的width，会改变dom的宽度

- `newVal` {Number} 新的宽度

##### `setHeight(newVal)`

对`textarea` 封装对象设置新的height，会改变dom的高度

- `newVal` {Number} 新的高度

##### `setFontSize(newVal)`

对`textarea` 封装对象设置新的FontSize，会改变dom文本框内的字体大小。

- `newVal`  新的字体大小

---

##### `getTop()`

获取绝对位置的`Top`参数（距离顶部的距离）

返还值

- `{Number}`  

##### `getLeft()`

获取绝对位置的`Left`参数（距离最左侧的距离）

返还值

- `{Number}`  

##### `getRelativeX()`

获取绝对位置的`relativeOffset.relativeX`参数，相对于注册对象内部的相对X坐标。

返还值

- `{Number}`

##### `getRelativeY()`

获取绝对位置的`relativeOffset.relativeY`参数，相对于注册对象内部的相对Y坐标。

返还值

- `{Number}`


##### `getContent()`

获取`textarea`中输入的内容

返还值

- `{String}`

##### `getFontSize()`

获取`textarea`中文字大小

返还值

- `{Number}`

##### `getWidth()`

获取`textarea`的宽度

返还值

- `{Number}`

##### `getHeight()`

获取`textarea`的高度

返还值

- `{Number}`

##### `getRectBox()`

获取`textarea`在注册对象中的百分比位置

返还值

- `{Object}`

```
{
      topLeftX: {Float},
      topLeftY: {Float},
      bottomRightX: {Float},
      bottomRightY: {Float}
}
```

---

### `init([registerObject, mode])`

初始化函数，在调用函数之前必须先初始化，否则会出现没有右键菜单的问题。

- `registerObject`，组件依赖的DOM元素，可选，默认值`document.body`。
- `mode` 如果该值为`free` 那么就可以在注册元素上拖拽出一个`textarea`

### `getCurrentNode()`

获取但前操作的textarea节点

返还值
```javascript
TextAreaNode
```

### `restores(nodeArray)`

通过节点对象数组还原所有节点对象

- `nodeArray` {Array} 节点对象数组

### `build(node)`

重新将节点加入文档中

- `node` {TextAreaNode}节点对象

### `removeAll()`

删除所有文本框，并且返还他们的节点对象数组，该数组可以采用`restores`还原。

返还值

- `{TextAreaNode[]}` 被移除的所有节点

### `setCurrentNodeFontSize(newVal)`

设置当前编辑的节点的字体大小

- `newVal` {number} 新的字体大小

### `setDefaultFontSize(newVal)`

设置默认字体大小

- `newVal` {number}字体大小

### `getAllNode()`

获取所有的节点

返还值

- `{TextAreaNode[]}` 所有节点

### `getAllNodeInfo()`

获取所有`textarea`的信息
```json
{
  txt: string,
  relativeX: *,
  relativeY: *,
  width,
  height,
  topLeftX: number,
  topLeftY: number,
  bottomRightX: number,
  bottomRightY: number,
}
```

### `client2Absolute(client)`

点击坐标转换为页面绝对坐标

- `client` 鼠标点击事件或类似于`{clientX:numberr, clientY:number}`结构的对象

返还值：
```
{{top: number, left: number, convert: (function(): {top: string, left: string})}}
```

### `add(id,attribute[,callback])`

增加一个新的`textarea`

- `id` 新增加的`textarea`的ID，可用次ID获取对象的相关信息。
- `attribute` 一个包含`{coord:{clientX:number, clientY:number}}`参数的对象`coord`参数，可以是一个鼠标点击事件，还可以附带创建`textarea`的其他参数如`width, height, fontSize` 这些参数为可选参数。
- `callback` 回调函数

### `findById(id)`

通过ID获取整个`textarea`对象节点

- `id`  获取已创建的`textarea`的id

返还值
```javascript
{
    id,
    left,
    top,
    fontSize,
    width,
    height,
    relativeOffset,
    dom
}
```

### `removeById(id)`

根据ID删除已经创建的`textarea`对象

- `id` 节点ID

### `getNodeInfoById(id)`

根据ID 获取已创建的`textarea`对象对象信息。

- `id` `textarea`的ID

返还值：
```
{{txt: string, relativeX: *, relativeY: *, width, height, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number}}
```

### `setOnFocus(callback)`

设置文本框获取到焦点时触发的回调函数

- `callback` {Function} 回调函数