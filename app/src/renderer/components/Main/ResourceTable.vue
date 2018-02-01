<style lang="scss" scoped>
    .layout-content {
        margin: 15px;
        //overflow: scroll;
        background: #fff;
        flex: 1;
        overflow: scroll;
    }


</style>
<style lang="scss" >
    .primary-line-btn {
/*        background: #FFFFFF;
        color: #333333;
        border-color: rgba(45, 156, 255, 0.45);*/
    }
    .error-line-btn {
/*        background: #FFFFFF;
        color: #333333;
        border-color: rgba(255, 66, 20, 0.45);*/
    }

    .foldericon {
        margin-right: 8px;
        font-size: 20px;
        color: #6ca5e2;
    }

</style>
<template>
    <div class="layout-content">
        <Table ref="table" border :columns="columns" :context="self"
               :data="filterfiles" no-data-text="暂无数据"
               v-on:on-context-menu="onRowClick"
               :row-class-name="rowClassName"
               @on-selection-change="onSelectionChange"></Table>
        <Modal
                v-model="deleteNoAskModel"
                title="确认删除文件？"
                @on-ok="doRemove">
            <p>{{deleteKey}}</p>
        </Modal>
    </div>
</template>
<script>
    import {mapGetters} from 'vuex'
    import {Constants, EventBus} from '../../service/index'
    import * as types from '../../vuex/mutation-types'
    import mixin_resource from '../../mixins/mixin-resource'
    import moment from 'moment'

    let tempNum;

    export default {
        name: 'ResourceTable',
        mixins: [mixin_resource],
        data() {
            return {
                self: this,
                tableHeight: 100,
                tableWidth: 100,
                columns: [
                    {
                        type: 'selection',
                        width: 50,
                        align: 'center',
                        render(h, item) {
                            if (item.row.folder) {
                                return '';
                            }
                        },
                    },
                    {
                        title: '文件名', ellipsis: false,
                        render(h, item) {
                            if (item.row.folder) {
                                return h('div', [h('Icon', { class:'foldericon', props: {type: 'folder'} }), h('span', item.row.filename)])
                            } else {
                                return item.row.filename;
                            }
                        }
                    },
                    {
                        title: '大小', key: 'fsize', sortable: true, width: 100,
                        render(h, item) {
                            let row = item.row;
                            if (row.fsize >= 1024 * 1024) {
                                return (row.fsize / 1024 / 1024).toFixed(2) + ' MB'
                            } else if (row.fsize >= 1024 && row.fsize < 1024 * 1024) {
                                return (row.fsize / 1024).toFixed(2) + ' KB'
                            } else {
                                return (row.fsize).toFixed(2) + ' B'
                            }
                        }
                    },
                    {title: '类型', key: 'mimeType', width: 100},
                    {
                        title: '上传日期', key: 'putTime', sortable: true, sortType: 'desc', width: 150,
                        render(h, item) {
                            if (item.row.putTime > 101556888398493720) {
                                return '';
                            }
                            return moment(item.row.putTime / 10000).format('YYYY-MM-DD HH:mm:ss');
                        }
                    },
                    {
                        title: '操作', key: 'action', width: 175,
                        render: (h, item) => {
                            if (item.row.folder) {
                                return h('div', [
                                    h('i-button', {
                                        class:'primary-line-btn',
                                        props: {
                                            type: 'primary',
                                            size: 'small'
                                        },
                                        on: {
                                            click: () => {
                                                this.changeDir(item.row.currentDir);
                                            }
                                        }
                                    }, '进入文件夹'),
                                ]);
                            }
                            return h('div', [
                                h('i-button', {
                                    class:'primary-line-btn',
                                    props: {
                                        type: 'primary',
                                        size: 'small'
                                    },
                                    on: {
                                        click: () => {
                                            this.modify(item.index)
                                        }
                                    }
                                }, '修改信息'),
                                h('span', {}, ' '),
                                h('i-button', {
                                    class:'primary-line-btn',
                                    props: {
                                        type: 'primary',
                                        size: 'small'
                                    },
                                    on: {
                                        click: () => {
                                            this.copy(item.index)
                                        }
                                    }
                                }, '获取外链'),
                            ])
                        }
                    }],
            }
        },
        created() {
            EventBus.$off(Constants.Event.removes);
            EventBus.$on(Constants.Event.removes, () => {
                this.removes();
            });

            EventBus.$off(Constants.Event.download);
            EventBus.$on(Constants.Event.download, () => {
                this.downloadFiles();
            });

            EventBus.$off(Constants.Event.copy);
            EventBus.$on(Constants.Event.copy, () => {
                this.copyFiles();
            });

            EventBus.$off(Constants.Event.paste);
            EventBus.$on(Constants.Event.paste, () => {
                this.pasteFiles();
            });
        },
        mounted() {
            this.setTableSize();
            window.onresize = () => {
                this.setTableSize();
            }
        },
        methods: {
            onSelectionChange(selection) {
                console.log(selection);
                let selectionFiles = [];
                for (let i = 0; i < selection.length; i += 1) {
                    const item = selection[i];
                    if (item.folder) {
                        selectionFiles = selectionFiles.concat(item.children);
                    } else {
                        selectionFiles.push(item);
                    }
                }
                this.bucket.selection = selectionFiles;
                console.log(this.bucket.selection);
            },
            onRowClick(e) {
                console.log('click', e);
            },
            setTableSize() {
                if (this.$parent) {
                    let layout = this.$parent.$el;

                    //window.a = this.$parent.$el;
                    let style = window.getComputedStyle(layout.children[2]);

                    this.tableHeight = layout.clientHeight - layout.children[0].clientHeight - layout.children[1].clientHeight - parseInt(style.marginTop) - parseInt(style.marginBottom);
                }
            },
            rowClassName(row, index) {
                if (row.folder) {
                    return 'folder';
                }
                return '';
            },
        }
    };
</script>