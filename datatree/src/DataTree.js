/**
 * @file 带层级关系的数据的分析
 * 此文件主要是对有层级关系和状态的DOM展示效果的抽象，主要包括选中、半选、
 * 不选状态；为DOM组件设置值、获取值、追加值；删除DOM元素、添加DOM元素及移动
 * DOM元素等功能。
 * 使用方式：
 *    首先使用此组件Load数据，然后根据生成的索引数据进行DOM展示元素的生成。
 *    然后可以根据生成的索引数据进行DOM相关元素的生成，并为指定的DOM元素做索引，
 *    这样的话，DOM元素可以与索引数据进行对应，以后的所有变更可以根据所以直接
 *    反映到DOM元素上，可以做到逻辑与展示的分离。
 *主要包括以下功能：
 * 1：数据处理
 *      1）对扁平、层级数据统一解析
 *          扁平结构如：[{id: 1, text: '节点'}, {id: 2, pid: 1, text: '子节点'}]
 *          层级结构如：[{id: 1, text: '节点', child: [{id: 2, text: '子节点'}]}]
 *      2）为数据建立索引并根据此索引进行各种处理（程序内部分析数据关系用到的索引结构）
 *      3）清除索引数据（每次load会去掉之前的索引，一般程序内部调用，若外部用不到此功能，可以不对外提供）
 *      4）为数据提供适配处理（解决加载的数据的属性与DataTree解析的对应属性不一致的问题）
 * 2：状态设置
 *      1）包括批量更新数据的状态（对应全选、全取消）
 *      2）更新指定节点状态（对应选中或取消某个节点）
 *      3）设置值、获取值（对应初始化设置和提交时数据获取）
 * 3：数据移动
 *      1）把数据追加到指定位置（异步加载下级数据）
 *      2）把指定节点数据移除（删除指定节点）
 *      3）把指定节点数据迁移到另一个位置（拖拽节点到另一个节点下）
 * 
 * @author Zhang Shaolong(zhangshaolongjj@163.com)
 */
(function (root, factory) {
    var dataTree = factory();
    if (typeof define === 'function') {
        define(function() {
            return dataTree;
        });
    } else {
        root.DataTree = dataTree;
    }
})(this, function () {

    // 在索引关系数据的时候，key为null的索引为树根数据
    var ROOT_KEY = 'null';

    // 减少查找次数，提高效率
    var toString = Object.prototype.toString;

    // 提出来是为减少创建次数
    var ARRAY_TYPE = '[object Array]';

    // 默认的父ID的key为pid，本级ID的key为id，下级的key为child
    var DEFAULT_MAP_KEYS = {
        pid: 'pid',
        id: 'id',
        child: 'child'
    };

    // 支持关系数的3种状态，可对应树型展示时的不选，半选和选中状态
    var STATUS = {
        unchecked: 0,
        checked: 1,
        half: 2
    };

    var VALUE_TYPE = {
        onlyParent: 1,
        onlyLeaf: 2
    };

    /**
     * 为load的数据进行key的适配
     * 
     * @param {?Object} mapKeys 要适配的key对应关系
     * @param {DataTree} dataTree 当前DataTree实例
     */
    var setMapKeys = function (mapKeys, dataTree) {
        dataTree.mapKeys = {};
        each(DEFAULT_MAP_KEYS, function (val, key) {
            dataTree.mapKeys[key] = mapKeys && mapKeys[key] || val;
        });
    };

    var isArray = function (target) {
        return toString.call(target) === ARRAY_TYPE;
    };

    /**
     * 封装的for循环，支持对数组和Object类型的遍历
     * 
     * @param {Array|Object} arr 数组或Object类型
     * @param {Function} fun 要处理的任务
     *      fun接收两个参数，第一个为遍历的value，第二个为index或者key
     */
    var each = function (arr, fun) {
        if (!arr) {
            return;
        }
        if (isArray(arr)) {
            for (var idx = 0, len = arr.length; idx < len;) {
                if (fun.call(arr[idx], arr[idx], idx++) === false) {
                    break;
                }
            }
        } else if (arr.constructor === Object) {
            for (var idx in arr) {
                if (fun.call(arr[idx],arr[idx], idx) === false) {
                    break;
                }
            }
        }
    };
    
    /**
     * 创建索引数据函数
     * 
     * @param {Array.<Object>} data 需要分析的数据集合
     * @param {Object} mapKeys 适配器记录的key转换关系
     * @param {?Object} indexData 分析得出的数据索引
     * @param {?Object} indexRelation 分析得出的关系索引
     * @param {?string} pid 上级节点ID
     * @return {Object}
     */
    var buildIndex = function (data, mapKeys, indexData, indexRelation, pid) {
        var idKey = mapKeys.id;
        var pidKey = mapKeys.pid;
        var childKey = mapKeys.child;
        indexData = indexData || {};
        indexRelation = indexRelation || {};
        pid = pid === undefined ? null : pid;
        each(data, function (model, i) {
            var id = model[idKey];
            var pId = model[pidKey] || pid;
            var child = model[childKey];
            var relationMap = indexRelation[id];
            if (!relationMap) {
                relationMap = indexRelation[id] = {};
            }
            var dataInfo = indexData[id] = {};
            each(model, function (val, key) {
                if (childKey !== key && pidKey !== key) {
                    dataInfo[key] = val;
                }
            });
            var relationMapOfPid = indexRelation[pId];
            if (!relationMapOfPid) {
                relationMapOfPid = indexRelation[pId] = {};
            }
            var childOfPid = relationMapOfPid.child;
            if (!childOfPid) {
                childOfPid = relationMapOfPid.child = [];
            }
            childOfPid.push(id);
            relationMap.pid = pId;
            buildIndex(child, mapKeys, indexData, indexRelation, id);
        });
        return {
            indexData: indexData,
            indexRelation: indexRelation
        };
    };

    /**
     * append数据的时候，对数据关系进行关联
     * 
     * @param {Array.<Object>} data 需要修复的数据集合
     * @param {string} targetPid 数据的上级ID
     * @param {?string} idKey 数据中表示ID的key的字段名
     * @param {?string} pidKey 数据中表示上级ID的key的字段名
     * @param {?string} childKey 数据中表示下级的key的字段名
     */
    var updateData = function (data, targetPid, idKey, pidKey, childKey) {
        each(data, function (model) {
            var pid = model[pidKey];
            var id = model[idKey];
            if (pid === null || pid === undefined) {
                model[pidKey] = targetPid;
            }
            updateData(model[childKey], id, idKey, pidKey, childKey);
        });
    };

    /**
     * @constructor
     * 
     */
    var DataTree = function (option) {
        option = option || {};
        this.indexData = {};
        this.indexRelation = {};
        setMapKeys(option.mapKeys, this);
    };
    
    /**
     * 当前节点下是否有选中状态的下级节点
     * 
     * @param {string} id 当前级节点ID
     * @return {boolean}
     */
    DataTree.prototype.isHalf = function (id) {
        var child = this.indexRelation[id].child;
        if (child) {
            var len = child.length;
            if (len) {
                var status = this.indexRelation[child[0]].status;
                for (var i = 1; i < len; i++) {
                    if (this.indexRelation[child[i]].status != status) {
                        return true;
                    }
                }
            }
        }
        return status === STATUS.half;
    };
    
    /**
     * 判断两个节点是否是父子关系，用于移动节点时的check
     * 
     * @param {string} 父级节点ID
     * @param {string} 被判断的子节点ID
     * @return {boolean} 是否是父子关系
     */
    DataTree.prototype.isDescendant = function (id, childId) {
        var indexRelation = this.indexRelation;
        var isChild = false;
        var isContains = function (id, childId) {
            var child = indexRelation[id].child;
            if (child) {
                each(child, function (id) {
                    if (id === childId) {
                        return !(isChild = true);
                    }
                    isContains(id, childId);
                });
            }
        };
        isContains(id, childId);
        return isChild;
    };
    
    /**
     * 是否可以进行节点的移动
     * 
     * @param {string} 被移动的节点ID
     * @param {string} 移动到的目标节点ID
     * @return {boolean} 是否可移动
     */
    DataTree.prototype.isMoveable = function (id, targetId) {
        var indexRelation = this.indexRelation;
        if (id === targetId) {
            return false;
        }
        if (!indexRelation[id] || !indexRelation[targetId]) {
            return false;
        }
        return !this.isDescendant(id, targetId);
    };
    
    /**
     * 数据加载器，加载后，自动解析为带索引的数据进行存储
     * 
     * @param {Array.<Object>} 加载的数据集
     */
    DataTree.prototype.load = function (data) {
        if (data) {
            this.clearIndex();
            var indexResult = this.buildIndex(data);
            this.indexData = indexResult.indexData;
            this.indexRelation = indexResult.indexRelation;
        }
    };

    /**
     * 生成索引数据，为数据分析提供支持
     * 
     * @param {Array.<Obejct>} data 数据集
     */
    DataTree.prototype.buildIndex = function (data) {
        return buildIndex(data, this.mapKeys);
    };

    /**
     * 清除索引数据，会丢弃之前的索引数据
     */
    DataTree.prototype.clearIndex = function () {
        this.indexData = {};
        this.indexRelation = {};
    };

    /**
     * 批量更新数据的状态
     * 
     * @param {boolean} status 被更新到的状态，只能是选中和不选
     */
    DataTree.prototype.updateAllStatus = function (status) {
        var indexRelation = this.indexRelation;
        each(indexRelation, function (model) {
            model.status = status;
        });
    };
    
    /**
     * 重新设置数据的选中数据，与addValue不同，会清空之前选中的值
     * 
     * @param {Array.<string>} ids 被设置选中的节点ID集合
     */
    DataTree.prototype.setValue = function (ids) {
        this.updateAllStatus(false);
        this.addValue(ids);
    };
    
    /**
     * 获取所有选中节点的ID集合
     * 
     * @param {?VALUE_TYPE} valueType
     *      1：仅获取选中的ID，不进行下级ID的获取
     *      2：仅获取选中的叶子ID
     *      default：获取所有选中的ID
     * @return {Array.<string>} 选择的节点ID集合
     */
    DataTree.prototype.getValue = function (valueType) {
        var indexData = this.indexData;
        var indexRelation = this.indexRelation;
        var selected = [];
        this.traverse(function (id, relationModel) {
            if (relationModel.status === STATUS.checked) {
                switch (valueType) {
                    case VALUE_TYPE.onlyParent:
                        selected.push(id);
                        return false;
                    case VALUE_TYPE.onlyLeaf:
                        if (!relationModel.child) {
                            selected.push(id);
                        }
                        break;
                    default :
                        selected.push(id);
                }
            }
        });
        return selected;
    };

    /**
     * 在原有选中基础上进行增量添加
     * 
     * @param {Array.<string>} ids 被批量增加的节点ID集合
     */
    DataTree.prototype.addValue = function (ids) {
        if (ids === undefined || ids === null) {
            return;
        }
        ids = [].concat(ids);
        var me = this;
        each(ids, function (id) {
            me.updateStatusById(id, STATUS.checked);
        });
    };

    /**
     * 提供一个可以遍历数据的方法
     * 
     * @param {Function} fun 提供处理每个遍历数据的函数
     *      arguments：（id, relationModel, dataModel)
     * @param {?string} id 从指定节点遍历
     * @param {?integer} level 当前数据所处的层级
     */
    DataTree.prototype.traverse = function (fun, id, level) {
        var me = this;
        id = id === undefined ? null : id;
        level = level || 0;
        var indexRelation = me.indexRelation;
        var indexData = me.indexData;
        var relationModel = indexRelation[id];
        if (relationModel) {
            if (fun(id, relationModel, indexData[id], level) !== false) {
                each(relationModel.child, function (id) {
                    me.traverse(fun, id, level + 1);
                });
            }
        }
    };
    
    /**
     * 通过指定ID更新关系数据的数据状态
     * 
     * @param {string} id 节点ID
     * @param {boolean} status 节点状态
     */
    DataTree.prototype.updateStatusById = function (id, status) {
        var indexRelation = this.indexRelation;
        var model = indexRelation[id];
        if (model) {
            model.status = status = (status == STATUS.checked)
                ? STATUS.checked : STATUS.unchecked;
            this.updateChilds(model.child, status);
            this.updateParents(model.pid, status);
        }
    };
    
    /**
     * 更新指定节点的所有父级节点的状态
     * 
     * @param {string} id 节点ID
     * @param {boolean} status 节点状态
     */
    DataTree.prototype.updateParents = function (id, status) {
        id = id === undefined ? null : id;
        var indexRelation = this.indexRelation;
        if (status === STATUS.half || this.isHalf(id)) {
            status = STATUS.half;
        }
        var relationModel = indexRelation[id];
        if (relationModel) {
            relationModel.status = status;
            if (id !== null) {
                this.updateParents(relationModel.pid, status);
            }
        }
    };
    
    /**
     * 更新指定节点的所有子级节点的状态
     * 
     * @param {string} id 节点ID
     * @param {boolean} status 节点状态
     */
    DataTree.prototype.updateChilds = function (ids, status) {
        if (ids) {
            var indexRelation = this.indexRelation;
            var me = this;
            each(ids, function (id) {
                var relationModel = indexRelation[id];
                relationModel.status = status;
                me.updateChilds(relationModel.child, status);
            });
        }
    };
    
    /**
     * 把数据添加到指定节点上
     *     如果是扁平数据结构，可以通过data中的pid自动追加到已存在的pid数据
     *     的child上，所以扁平数据中的targetId可能有多个。
     * 
     * @param {Array.<Object>} data 被添加的数据
     * @param {string} targetId 被添加到的节点ID
     * @return {Array.<string>} 返回添加的数据中属于数据的顶级ID集合
     */
    // TODO(zhangshaolong) 追加节点未实现更新相关的节点状态
    DataTree.prototype.appendDataTo = function (data, targetId) {
        if (!data) {
            return ;
        }
        var targets = [];
        var targetIndexData = this.indexData;
        var targetIndexRelation = this.indexRelation;
        targetId = targetId === undefined ? null : targetId;
        updateData(
            data,
            targetId,
            this.mapKeys.id, this.mapKeys.pid, this.mapKeys.child
        );
        var indexResult = this.buildIndex(data);
        var indexRelation = indexResult.indexRelation;
        each(indexRelation, function (model, id) {
            if (model.pid === null || model.pid === undefined) {
                var targetModelOfId = targetIndexRelation[id];
                if (targetModelOfId) {
                    var targetChildOfId = targetModelOfId.child;
                    if (!targetChildOfId) {
                        targetChildOfId = targetModelOfId.child = [];
                    }
                    model.pid = targetModelOfId.pid;
                    each(model.child, function (cId) {
                        targetChildOfId.push(cId);
                    });
                }
            }
        });
        each(indexResult.indexData, function (model, key) {
            if (!targetIndexData[key]) {
                targetIndexData[key] = model;
            } else {
                throw '添加的数据中有已经存在的节点';
            }
        });
        each(indexResult.indexRelation, function (model, key) {
            if (!targetIndexRelation[key]) {
                targetIndexRelation[key] = model;
            }
        });
        return targets;
    };
    
    /**
     * 删除指定节点数据
     * 
     * @param {string} id 被删除的节点ID，他下面的所有数据一起被移除
     * @param {?boolean} ignoreIndex 是否移除父级对此id的索引，
     *      自动处理，不需要传
     */
    // TODO(zhangshaolong) 删除节点未实现更新相关的节点状态
    DataTree.prototype.remove = function (id, ignoreIndex) {
        var me = this;
        id = id === undefined ? null : id;
        var indexRelation = this.indexRelation;
        var indexModel = indexRelation[id];
        if (indexModel) {
            delete indexRelation[id];
            delete this.indexData[id];
            if (!ignoreIndex) {
                var pid = indexModel.pid;
                if (pid !== undefined) {
                    each(indexRelation[pid].child, function (sibling, i) {
                        if (sibling === id) {
                            indexRelation[pid].child.splice(i, 1);
                            return false;
                        }
                    });
                }
            }
            each(indexModel.child, function (id, i) {
                delete me.indexData[id];
                me.remove(id, true);
            });
        }
    };
    
    /**
     * 把指定节点移动到另外节点上
     * 
     * @param {string} id 被移动的节点ID
     * @param {string} targetId 被移动到的目标节点ID
     */
    // TODO(zhangshaolong) 移动节点未实现更新相关的节点状态
    DataTree.prototype.moveTo = function (id, targetId) {
        var me = this;
        var indexRelation = this.indexRelation;
        targetId = targetId === undefined ? null : targetId;
        if (this.isMoveable(id, targetId)) {
            var siblings = indexRelation[indexRelation[id].pid].child;
            each(siblings, function (sibling, i) {
                if (sibling === id) {
                    siblings.splice(i, 1);
                    indexRelation[id].pid = targetId;
                    var targetModel = indexRelation[targetId];
                    var targetChild = targetModel.child;
                    if (!targetChild) {
                        targetChild = targetModel.child = [];
                    }
                    targetChild.push(id);
                    me.updateParents(targetId, targetModel.status || false);
                    return false;
                }
            });
        }
    };
    DataTree.ROOT_KEY = ROOT_KEY;
    DataTree.STATUS = STATUS;
    DataTree.VALUE_TYPE = VALUE_TYPE;
    return DataTree;
})