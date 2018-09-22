/**
 * A simple and flexible plugin for dynamically creating textarea
 * @author Cliven
 * @type {{txtAreaMap: {}, deleteMenu: {}, registerDom: {}, allowDragCreate: boolean, isDragging: boolean, txtAreaCnt: number, currentDraggingNode: {}, draggingMouseDown: {relativeX: number, relativeY: number}, mouseOutState: number, txtAreaFocusCallback: txtAreaFocusCallback}}
 */
window.FreeTextarea = (function () {
    var module = {
        // textarea save map, key is id of textarea, value is the textarea dom object
        txtAreaMap: {},
        // delete menu dom
        deleteMenu: {},
        // register dom
        registerDom: {},
        // allow drag and drop creation
        allowDragCreate: false,
        // Is it in the state of drag creation
        isDragging: false,
        // textarea number counter
        txtAreaCnt: 0,
        // current dragging textarea
        currentDraggingNode: {},
        // a absolute coordinate dragging create mouse down
        draggingMouseDown: {
            relativeX: 0,
            relativeY: 0
        },
        // to controller mouse out the register element
        mouseOutState: 0,
        // Triggers callback when the textarea gets focus
        txtAreaFocusCallback: function (thiz) {
        }
    };

    module.DEFAULT_TXT_AREA_WIDTH = '163px';
    module.DEFAULT_TXT_AREA_HEIGHT = '36px';
    module.DEFAULT_TXT_AREA_FONT_SIZE = '14px';

    /**
     * Construct node object
     * @param id DOM id
     * @param attribute  required parameter {id,left, top}
     * @author Cliven
     */
    function TextAreaNode(id, attribute) {
        this.id = id;
        this.left = attribute.left;
        this.top = attribute.top;
        this.fontSize = attribute.fontSize || module.DEFAULT_TXT_AREA_FONT_SIZE;
        this.width = attribute.width || module.DEFAULT_TXT_AREA_WIDTH;
        this.height = attribute.height || module.DEFAULT_TXT_AREA_HEIGHT;
        // calculate the offset of register element
        this.relativeOffset = windowToRelative(attribute.coord);
        // console.log(this.relativeOffset);
        // create dom
        var textAreaDom = document.createElement("textarea");
        textAreaDom.setAttribute("id", this.id);
        textAreaDom.style['position'] = "absolute";
        textAreaDom.style['left'] = this.left;
        textAreaDom.style['top'] = this.top;
        textAreaDom.style['width'] = this.width;
        textAreaDom.style['height'] = this.height;
        textAreaDom.style['font-size'] = this.fontSize;
        textAreaDom.style['background-color'] = "transparent";

        // state of the dom is dragging move place
        this.isDragInMoving = false;
        this.isFocusing = false;
        this.lastCoordinate = {};
        this.dom = textAreaDom;

        // shield default right click menu
        this.dom.addEventListener("contextmenu", function (e) {
            // console.log("contextmenu");
            e.preventDefault();
            // console.log("textArea box",e);
            var coordinate = module.client2Absolute(e).convert();
            module.deleteMenu.style.left = coordinate.left;
            module.deleteMenu.style.top = coordinate.top;
            module.deleteMenu.style.width = '100px';
            return false;
        });
        // when textarea get focus, active the delete set delete menu available
        this.dom.addEventListener("focus", function (ev) {

            var id = this.getAttribute("id");
            var selfNode = getNodeByDom(this);
            // set flag
            selfNode.isDragInMoving = false;
            // change the cursor style
            selfNode.getDom().style.cursor = "text";
            // Trigger callback
            module.txtAreaFocusCallback(module.txtAreaMap[id]);
        });

        // do not allowed mouse down event enter the textarea
        this.dom.addEventListener("mousedown", function (ev) {
            var id = this.getAttribute("id");
            var node = getNodeByDom(this);
            // Ignore the lower right corner to make the control function available
            if ((node.getHeight() - 5 < ev.offsetY) && (node.getWidth() - 5 < ev.offsetX)) {
                return true;
            }
            // if in focus then set drag moving state
            if (node.isFocusing) {
                return true;
            }
            ev.preventDefault();
            // switch the current node
            switchCurrentNodeById(id);
            // save click down coordinate
            node.lastCoordinate = {clientX: ev.clientX, clientY: ev.clientY};
            // switch current dragging move state on
            switchDragMoveState(this, true);
            return false;
        });
        // Double click to enter the focus state
        this.dom.addEventListener("dblclick", function (ev) {
            // Get focus
            this.focus();
            getNodeByDom(this).isFocusing = true;
            ev.preventDefault();
            return false;
        });
        // add dragging create event to support then mouse enter the textarea
        this.dom.addEventListener("mousemove", function (ev) {

            var selfNode = getNodeByDom(this);
            // check is drag moving
            if (selfNode && selfNode.isDragInMoving) {
                // console.log("mousemove", ev);
                var dx = ev.clientX - selfNode.lastCoordinate.clientX,
                    dy = ev.clientY - selfNode.lastCoordinate.clientY;
                // move dom position
                selfNode.movePosition(dx, dy);
                selfNode.getDom().style.cursor = "default";
                // update current coordinate
                selfNode.lastCoordinate = {clientX: ev.clientX, clientY: ev.clientY};
            }
            return draggingMove(ev);
        });
        // add dragging create event to support mouse up inside the textarea
        this.dom.addEventListener("mouseup", function (ev) {
            var node = getNodeByDom(this);
            // clean last coordinate
            node.lastCoordinate = {};
            // switch current dragging move state off
            switchDragMoveState(this, false);
            return draggingUp(ev);
        });
        // to move drag move state
        this.dom.addEventListener("mouseout", function (ev) {
            var node = getNodeByDom(this);
            // clean last coordinate
            node.lastCoordinate = {};
            // switch current dragging move state on
            switchDragMoveState(this, false);
            return false;
        });
        // set the focus flag false to enable drag moving
        this.dom.addEventListener("blur", function (ev) {
            getNodeByDom(this).isFocusing = false;
        });

        /**
         * move the dom position in the page
         * @param dx
         * @param dy
         * @author Cliven
         */
        this.movePosition = function (dx, dy) {
            this.setLeft(this.getLeft() + dx);
            this.setTop(this.getTop() + dy);

            // Get Browser scrolling position
            var offsetTop = document.documentElement.scrollTop || document.body.scrollTop,
                offsetLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
            // reset relative position
            this.relativeOffset = windowToRelative({
                clientX: this.getLeft() - offsetLeft,
                clientY: this.getTop() - offsetTop
            });
        };

        this.getDom = function () {
            return this.dom;
        };
        this.setId = function (newVal) {
            textAreaDom.setAttribute("id", newVal);
        };
        this.setLeft = function (newVal) {
            if (!isNaN(newVal)) {
                newVal += "px";
            }
            this.left = newVal || this.left;
            this.dom.style['left'] = this.left;
        };
        this.setTop = function (newVal) {
            if (!isNaN(newVal)) {
                newVal += "px";
            }
            this.top = newVal || this.top;
            this.dom.style['top'] = this.top;
        };
        this.setWidth = function (newVal) {
            if (!isNaN(newVal)) {
                newVal += "px";
            }
            this.width = newVal || this.width;
            this.dom.style['width'] = this.width;
        };
        this.setHeight = function (newVal) {
            if (!isNaN(newVal)) {
                newVal += "px";
            }
            this.height = newVal || this.height;
            this.dom.style['height'] = this.height;
        };
        this.setFontSize = function (newVal) {
            if (!isNaN(newVal)) {
                newVal += "px";
            }
            this.fontSize = newVal || this.fontSize;
            this.dom.style['font-size'] = this.fontSize;
        };
        // ---------------------------------------------------------
        this.getTop = function () {
            return parseInt((this.top).replace(" ", "").replace("px", ""));
        };
        this.getLeft = function () {
            return parseInt((this.left).replace(" ", "").replace("px", ""));
        };
        this.getRelativeX = function () {
            return this.relativeOffset.relativeX;
        };
        this.getRelativeY = function () {
            return this.relativeOffset.relativeY;
        };

        /**
         * Get the editor content
         * @return {string}
         */
        this.getContent = function () {
            return this.dom.value;
        };

        /**
         * Get the textarea font size
         * @return {number}
         */
        this.getFontSize = function () {
            return parseInt((this.dom.style['font-size']).replace(" ", "").replace("px", ""));
        };

        this.getWidth = function () {
            return parseInt((this.dom.style['width']).replace(" ", "").replace("px", ""));
        };

        this.getHeight = function () {
            return parseInt((this.dom.style['height']).replace(" ", "").replace("px", ""));
        };
        /**
         * Get percentage coordinate of the textarea in the register element
         * @author Cliven
         * @return {{topLeftX: string, topLeftY: string, bottomRightX: string, bottomRightY: string}}
         */
        this.getRectBox = function () {
            // get element height and width
            var elementWidth = (module.registerDom.width || module.registerDom.style.width) * 1.0,
                elementHeight = (module.registerDom.height || module.registerDom.style.height) * 1.0;

            return {
                // // calculate percentage coordinate
                topLeftX: keepDot2((this.getRelativeX()) / elementWidth * 100),
                topLeftY: keepDot2((elementHeight - this.getRelativeY()) / elementHeight * 100),
                bottomRightX: keepDot2((this.getRelativeX() + this.getWidth()) * 1.0 / elementWidth * 100),
                bottomRightY: keepDot2((elementHeight - this.getRelativeY() - this.getHeight()) * 1.0 / elementHeight * 100)
            }
        };
        /**
         * update dom style
         */
        this.updateStyle = function () {
            this.dom.style['left'] = this.left;
            this.dom.style['top'] = this.top;
            this.dom.style['width'] = this.width;
            this.dom.style['height'] = this.height;
            this.dom.style['font-size'] = this.fontSize;
        }
    }

    /**
     * switch the TextAreaNode inside dragMoving state
     * @param dom operate dom object, it can be an standard event callback "this"
     * @param state the state want to be
     * @author Cliven
     */
    function switchDragMoveState(dom, state) {

        // var id = dom.getAttribute("id");
        var selfNode = getNodeByDom(dom);
        // insure node exist
        if (selfNode) {
            if (state === undefined) {
                // switch isDragInMoving state off
                selfNode.isDragInMoving = !selfNode.isDragInMoving;
            } else {
                selfNode.isDragInMoving = state;
            }
        }
    }

    /**
     * Get textarea node object by dom
     * @author Cliven
     * @param dom
     * @return {*}
     */
    function getNodeByDom(dom) {
        var id = dom.getAttribute("id");
        return module.txtAreaMap[id];
    }

    /**
     * switch current node by id
     * @param id DOM ID
     * @author Cliven
     */
    function switchCurrentNodeById(id) {
        // change the previous focus node style to none, if exist
        if (module.currentDraggingNode) {
            module.currentDraggingNode.getDom().style['border'] = "";
            // lose focus
            module.currentDraggingNode.getDom().blur();
        }
        // switch the current node
        module.currentDraggingNode = module.txtAreaMap[id];
        module.deleteMenu.setAttribute("activeId", id);
        // to simulation a no focus state
        module.currentDraggingNode.getDom().style['border'] = "#A6C7FE solid 2px";
    }

    /**
     * Keep two decimals
     * @author Cliven
     * @param val
     * @return {string}
     */
    function keepDot2(val) {
        if (!isNaN(val)) {
            val = parseFloat(val);
        }
        return parseFloat(val).toFixed(2);
    }

    /**
     * init module
     * @param registerObject where the plugin effective optional if null it will be body
     * @param mode if the value is "free" you can drag an text area in the register element
     * @author Cliven
     */
    module.init = function (registerObject, mode) {

        console.log("Init TxtAreaBox plugin...");
        if (mode === "free") {
            module.allowDragCreate = true;
        }
        // put to module
        module.registerDom = registerObject || document.body;
        module.addDeleteMenu();
        // if allow create a textarea by dray, register drag function
        if (module.allowDragCreate === true) {
            module.registerDragCreate();
        }
    };

    /**
     * callback function when textarea get focus
     * @author Cliven
     * @param callback
     */
    module.setOnFocus = function (callback) {
        module.txtAreaFocusCallback = callback;
    };

    /**
     * Set a new font size as default font size
     * @author Cliven
     * @param newVal
     */
    module.setDefaultFontSize = function (newVal) {
        if (!isNaN(newVal)) {
            newVal += "px";
        }
        module.DEFAULT_TXT_AREA_FONT_SIZE = newVal;
    };

    /**
     * Get a auto increase textarea id
     * @author Cliven
     * @return {string}
     */
    function getAutoIncreaseId() {
        return "_textarea_" + module.txtAreaCnt++;
    }

    /**
     * Get current focus node
     * @author Cliven
     * @return {module.currentDraggingNode|{}|*|null}
     */
    module.getCurrentNode = function () {
        return this.currentDraggingNode;
    };

    /**
     * Register a drag function to allow create a textarea by drag
     */
    module.registerDragCreate = function () {

        // mouse down start the dragging flag
        module.registerDom.addEventListener("mousedown", function (e) {
            module.isDragging = true;
            // add a no space textarea
            module.currentDraggingNode = module.add(getAutoIncreaseId(), {
                coord: e,
                height: "0px",
                width: "0px"
            });
            // save start drag point
            module.draggingMouseDown = client2Absolute(e);
        });

        // mouse down start the dragging flag
        module.registerDom.addEventListener("mousemove", draggingMove);
        // mouse up start the dragging flag
        module.registerDom.addEventListener("mouseup", draggingUp);
        // // mouse out of the register element,end of create of textarea
        // module.registerDom.addEventListener("mouseout", function (e) {
        //     if (!module.isDragging) {
        //         module.mouseOutState = 0;
        //         return;
        //     }
        //     // dragging and out of the register element
        //     if (module.mouseOutState === 1) {
        //         // draggingUp(e);
        //         return;
        //     }
        //     // change mouse state
        //     module.mouseOutState = 1;
        // });
    };

    /**
     * Mouse up function during dragging finish
     * @param e event
     * @author Cliven
     */
    function draggingUp(e) {
        if (!module.isDragging) {
            return;
        }
        module.draggingMouseDown = {};
        // e.preventDefault();
        module.isDragging = false;
        // reset the mouse out state
        module.mouseOutState = 0;
        // if the area is too small， it is judged as invalid area then delete
        if (module.currentDraggingNode.getWidth() < 5 || module.currentDraggingNode.getHeight() < 5) {
            module.removeById(module.currentDraggingNode.id);
        }
        return false
    }

    /**
     * reset the text area position
     * @param clientCoord client coordinate it can be a click event
     */
    function reSetPosition(clientCoord) {
        // convert the coordinate to a page relative
        var currentLoc = client2Absolute(clientCoord);

        var x = currentLoc.left,
            y = currentLoc.top;

        var node = module.currentDraggingNode;

        // get the smallest point as the starting coordinate
        var left = Math.min(x, module.draggingMouseDown.left),
            top = Math.min(y, module.draggingMouseDown.top);
        // calculate new width and height of textarea
        var width = Math.abs(x - module.draggingMouseDown.left),
            height = Math.abs(y - module.draggingMouseDown.top);
        // console.log("left", left, "top", top);
        // console.log("width", width, "height", height);
        node.setLeft(left);
        node.setTop(top);
        node.setWidth(width);
        node.setHeight(height);
    }

    /**
     * Mouse movement function during dragging
     * @param e event
     * @author Cliven
     */
    function draggingMove(e) {
        if (!module.isDragging) {
            return;
        }
        e.preventDefault();
        // mouse reverse movement need change the textarea position
        reSetPosition(e);
    }

    /**
     * reset the new font size of current edict textarea
     * @author Cliven
     * @param newVal
     */
    module.setCurrentNodeFontSize = function (newVal) {
        if (module.currentDraggingNode) {
            // find the node and set font size
            module.currentDraggingNode.setFontSize(newVal);
        }
    };

    /**
     * Calculate the relative coordinate offset of the registered element
     * @param clientCoordinate client coordinate {clientX, clientY}
     * @author Cliven
     * @return {{relativeX: number, relativeY: number}}
     */
    function windowToRelative(clientCoordinate) {
        // get register element bounding client rect
        var elementRectangle = module.registerDom.getBoundingClientRect();

        // ratio of actual size to display size
        var ratioWidth = module.registerDom.width ? (module.registerDom.width / elementRectangle.width) : 1,
            ratioHeight = module.registerDom.height ? (module.registerDom.height / elementRectangle.height) : 1;

        return {
            relativeX: (clientCoordinate.clientX - elementRectangle.left) * ratioWidth
            , relativeY: (clientCoordinate.clientY - elementRectangle.top) * ratioHeight
        };
    }

    /**
     * get all created node of the register
     * @return {Array}
     */
    module.getAllNode = function () {
        var res = [], cnt = 0;
        Object.keys(module.txtAreaMap).forEach(function (key) {
            res[cnt++] = module.txtAreaMap[key];
        });
        return res;
    };

    /**
     * Add an element right-click menu, represent delete
     * @author Cliven
     */
    module.addDeleteMenu = function () {
        // create right-click menu
        var menuContainer = document.createElement("div");
        menuContainer.setAttribute("id", "_deleteMenu");
        menuContainer.style.width = "0px";
        menuContainer.style.height = "25px";
        menuContainer.style.overflow = "hidden";
        menuContainer.style.position = "absolute";
        menuContainer.style["z-index"] = "100";
        menuContainer.style.backgroundColor = "#fff";
        menuContainer.style.textAlign = "center";
        menuContainer.style['box-shadow'] = "0 1px 1px #888,1px 0 1px #ccc";
        module.deleteMenu = menuContainer;

        // create delete menu function item
        var menuItem = document.createElement("div");
        menuItem.setAttribute("id", "_deleteMenuItem");
        // menuItem.style.width = "130px";
        menuItem.style.height = "25px";
        menuItem.style['line-height'] = "25px";
        menuItem.style.padding = "0px";
        menuItem.innerText = "删除";

        // add the menu container to page
        document.body.appendChild(menuContainer);

        // add menu item to container
        menuContainer.appendChild(menuItem);

        // simulator
        menuItem.addEventListener("mouseenter", function (evt) {
            menuItem.style.cursor = "pointer";
            menuItem.style.backgroundColor = "#c9c9c9";
        });
        menuItem.addEventListener("mouseleave", function (evt) {
            menuItem.style.backgroundColor = "#fff";
        });
        // delete function click
        menuItem.addEventListener("click", function (evt) {
            // get current active textarea
            var targetId = module.deleteMenu.getAttribute("activeId");
            // remove current node
            module.currentDraggingNode = null;
            module.removeById(targetId);
        });

        // click other places close the right click menu
        window.onclick = function (e) {
            if (e.button === 0) {
                // console.log(e);
                // left click close menu
                module.deleteMenu.style.width = "0px";
            }
        }
    };


    /**
     * Convert click client position to document absolute coordinates
     * @param client  click event object (or an object has clientY, clientX)
     * @return {{top: number, left: number, convert: (function(): {top: string, left: string})}}
     * @author Cliven
     */
    function client2Absolute(client) {
        // offset of the window , compatible IE
        var offsetTop = document.documentElement.scrollTop || document.body.scrollTop,
            offsetLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
        // console.log("offsetTop", offsetTop, "offsetLeft", offsetLeft);
        return {
            top: offsetTop + client.clientY,
            left: offsetLeft + client.clientX,
            convert: function () {
                return {
                    top: this.top + "px",
                    left: this.left + "px"
                }
            }
        }
    }

    module.client2Absolute = client2Absolute;

    /**
     * Get node information by node id
     * @param id  node id
     * @author Cliven
     * @return {{txt: string, relativeX: *, relativeY: *, width, height, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number}}
     */
    module.getNodeInfoById = function (id) {
        var textAreaNode = module.findById(id);
        if (!textAreaNode) {
            return null;
        }
        // get element height and width
        var elementWidth = (module.registerDom.width || module.registerDom.style.width) * 1.0,
            elementHeight = (module.registerDom.height || module.registerDom.style.height) * 1.0;

        return {
            txt: textAreaNode.getDom().value,
            relativeX: textAreaNode.getRelativeX(),
            relativeY: textAreaNode.getRelativeY(),
            width: textAreaNode.getWidth(),
            height: textAreaNode.getHeight(),
            // calculate percentage coordinate
            topLeftX: (textAreaNode.getRelativeX()) / elementWidth,
            topLeftY: (elementHeight - textAreaNode.getRelativeY()) / elementHeight,
            bottomRightX: (textAreaNode.getRelativeX() + textAreaNode.getWidth()) * 1.0 / elementWidth,
            bottomRightY: (elementHeight - textAreaNode.getRelativeY() - textAreaNode.getHeight()) * 1.0 / elementHeight
        }
    };


    /**
     * Get all textarea information
     * @author Cliven
     * @return {Array}
     */
    module.getAllNodeInfo = function () {
        var nodeInfos = [];
        var cnt = 0;
        Object.keys(module.txtAreaMap).forEach(function (key) {
            // put the node info to array
            nodeInfos[cnt++] = module.getNodeInfoById(key);
        });
        return nodeInfos;
    };

    /**
     * restores all nodes to register element
     * @author Cliven
     * @param nodeArray
     */
    module.restores = function (nodeArray) {
        for (var i = 0; i < nodeArray.length; i++) {
            // re build a textarea DOM to the document body
            module.build(nodeArray[i]);
        }
    };

    /**
     * restore a textarea node
     * @param node
     * @author Cliven
     */
    module.build = function (node) {
        // get new id
        var id = getAutoIncreaseId();
        node.setId(id);
        // put to the map
        module.txtAreaMap[id] = node;
        // recreate dom in the register element
        document.body.appendChild(node.getDom());
    };

    /**
     * remove all node form register
     * @author Cliven
     * @return {Array}
     */
    module.removeAll = function () {
        var nodeArray = [];
        var cnt = 0;
        Object.keys(module.txtAreaMap).forEach(function (key) {
            // put the node info to array
            nodeArray[cnt++] = module.findById(key);
            // remove form txtAreaMap and register dom
            module.removeById(key);
        });
        // reset state
        module.resetState();
        return nodeArray;
    };

    /**
     * FreeTextArea inside state reset
     * @author Cliven
     */
    module.resetState = function () {
        // allow drag and drop creation
        module.allowDragCreate = false;
        // Is it in the state of drag creation
        module.isDragging = false;
        // textarea number counter
        module.txtAreaCnt = 0;
        // current dragging textarea
        module.currentDraggingNode = {};
        // a absolute coordinate dragging create mouse down
        module.draggingMouseDown = {
            relativeX: 0,
            relativeY: 0
        };
        // to controller mouse out the register element
        module.mouseOutState = 0;
    };

    /**
     * Add new DOM to exist DOM
     * @param id new DOM id parameter
     * @param attribute  {{coord: *, height: string, width: string}}click event object or a normal object required parameter {clientY, clientX}, and other {width, height, fontSize} is optional
     * @param callback  callback function
     * @return
     * @author Cliven
     */
    module.add = function (id, attribute, callback) {
        // if there has no coordinate parameter,do no thing
        if (!attribute['coord']) {
            return;
        }
        // convert client position to the page position
        var position = FreeTextarea.client2Absolute(attribute['coord']).convert();
        // set converted coordinate to attribute object
        attribute['top'] = position.top;
        attribute['left'] = position.left;

        // search if there already have a same id dom,then remove it
        var txtAreaDom = document.getElementById(id);
        if (txtAreaDom) {
            // remove dom
            document.body.removeChild(txtAreaDom);
        }
        // create dom Node
        var textAreaNode = new TextAreaNode(id, attribute);
        // add the node to save map
        module.txtAreaMap[id] = textAreaNode;
        // add DOM to container as a child
        document.body.appendChild(textAreaNode.dom);
        // focus the textarea
        textAreaNode.dom.focus();
        // call back function
        callback && callback(this);
        return module.txtAreaMap[id];
    };

    /**
     * get DOM node by dom ID
     * @param id dom id
     * @return dom Node object
     * @author Cliven
     */
    module.findById = function (id) {
        if (!id) {
            return null;
        }
        return module.txtAreaMap[id];
    };
    /**
     * get DOM node by dom ID
     * @param id dom id
     * @return dom Node object
     * @author Cliven
     * @since 2018-9-19 14:58:24
     */
    module.removeById = function (id) {
        if (!id) {
            return null;
        }
        var node = module.txtAreaMap[id];
        // remove from dom tree
        document.body.removeChild(node.dom);
        // remove from save reference map
        delete module.txtAreaMap[id];
    };

    /**
     * Add css to a DOM
     * @param domObject
     * @param cssObject
     * @author Cliven
     */
    module.addCSS2DOM = function (domObject, cssObject) {
        // Traversing object, treat object as a map
        Object.keys(cssObject).forEach(function (key) {
            domObject.style[key + ''] = (cssObject[key] + '')
        });
    };

    return module;
})();