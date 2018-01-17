<style lang="scss" scoped>
    .layout-copy {
        text-align: center;
        padding: 10px 0 20px;
        color: #9ea7b4;
    }

    .dir-layout {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 15px 15px 0 15px;
    }
</style>
<template>
    <div class="layout">
        <ClientHeader v-if="endable" :bucket="bucket" @on-update="onUpdate" @on-search="doSearch"></ClientHeader>

        <div class="dir-layout">
            <DirTag v-if="endable" :bucket="bucket" @on-click="doDirSearch"></DirTag>

            <Button type="ghost" size="small" @click="copy()" icon="ios-download"
                    style="margin-right: 10px;background: #FFFFFF;"
                    v-if="bucket.selection.length > 0">复制({{bucket.selection.length}})
            </Button>

            <Button type="ghost" size="small" @click="paste()" icon="ios-download"
                    style="margin-right: 10px;background: #FFFFFF;"
                    v-if="copyState">粘贴({{copyKeys.length}})
            </Button>

            <Button type="ghost" size="small" @click="downloads()" icon="ios-download"
                    style="margin-right: 10px;background: #FFFFFF;"
                    v-if="bucket.selection.length > 0">下载({{bucket.selection.length}})
            </Button>


            <Button type="error" size="small" @click="removes()" icon="trash-b" style="margin-right: 10px;"
                    v-if="bucket.selection.length > 0">删除({{bucket.selection.length}})
            </Button>

            <Button-group size="small" style="background: #FFF;margin-right: 10px;display: flex;">
                <Button :type="bucket.showType === 0 ? 'primary' : 'ghost'" @click="showType(0)"
                        icon="navicon-round"></Button>
                <Button :type="bucket.showType === 1 ? 'primary' : 'ghost'" @click="showType(1)" icon="images"></Button>
            </Button-group>

            <Button-group size="small" style="background: #FFF" v-if="bucket.marker">
                <Button type="ghost" @click="getResources" icon="chevron-right"></Button>
            </Button-group>
        </div>

        <resource-table v-if="endable && bucket.showType === 0" :bucket="bucket" @on-update="onUpdate" :showModifyModel="modify"></resource-table>
        <resource-grid v-else-if="endable && bucket.showType === 1" :bucket="bucket"
                       @on-update="onUpdate"></resource-grid>
        <Modal
                v-model="deleteNoAskModel"
                title="确认删除文件？"
                @on-ok="doRemove">
            <p v-for="file in bucket.selection">{{file.key}}</p>
        </Modal>

        <Modal
            v-model="modifyModel"
            title="修改文件元数据"
            @on-ok="doModify">
            <modify-form ref="modifyForm"></modify-form>
        </Modal>
    </div>
</template>
<script>
    import DirTag from '../components/Main/DirTag.vue';
    import ClientHeader from '../components/Main/ClientHeader.vue';
    import ResourceTable from '../components/Main/ResourceTable.vue';
    import ModifyForm from '../components/Main/ModifyForm.vue';

    import { cloudStorage } from '../service';
    import {mapGetters, mapState} from 'vuex';

    import * as types from '../vuex/mutation-types';

    import mixin_base from "../mixins/mixin-base";
    import {Constants, util, EventBus} from '../service/index';
    import ResourceGrid from "../components/Main/ResourceGrid.vue";

    export default {
        name: 'bucketPage',
        components: {
            ResourceGrid,
            DirTag, ClientHeader, ResourceTable,
            ModifyForm,
        },
        mixins: [mixin_base],
        props: {
            bucketname: {
                type: String,
                default: ''
            }
        },
        data() {
            return {
                bucket: {
                    name: '',
                    domains: [],
                    domain: '',
                    dirs: [],
                    currentDir: '',
                    isprivate: false,
                    marker: '',
                    files: [],
                    showType: 0,
                    selection: [],
                    withoutDelimiterFiles: []
                },
                endable: false,
                deleteNoAskModel: false,
                modifyModel: false,
            };
        },
        computed: {
            ...mapGetters({
                privatebucket: types.APP.setup_privatebucket,
                setup_deleteNoAsk: types.APP.setup_deleteNoAsk,
                customedomain: types.APP.setup_customedomain
            }),
            ...mapState({
                copyKeys: state => state.app.copy.srcKeys,
                copyState(state) {
                    const canCopy = this.bucket.name !== state.app.copy.srcBucket &&
                        state.app.copy.srcKeys.length > 0;
                    return canCopy;
                },
            }),
        },
        watch: {
            bucketname: function (val, oldVal) {
                if (val && oldVal !== val) {
                    this.initBucket(val);
                }
            }
        },
        created() {
            console.log('ipc on');
            this.$electron.ipcRenderer.removeAllListeners('updateDownloadProgress');
            this.$electron.ipcRenderer.on('updateDownloadProgress', (event, num, url, error) => {
                if (error) {
                    this.$store.commit(types.APP.download_set_file, [
                        { field: 'status', value: 'error', filepath: url },
                        { field: 'error', value: error, filepath: url },
                    ]);
                    return;
                }
                const lastTime = this.$store.state.app.upload.file[url].start;
                const lastBytes = this.$store.state.app.upload.file[url].bytes || 0;
                const currentTime = Date.now();
                const downloadPengingCount = this.$store.getters[types.APP.download_status_filelist]('pending').length;
                if (currentTime - lastTime > downloadPengingCount * 500) {
                    const fileSize = this.$store.state.app.upload.file[url].size;
                    const receivedBytes = num * fileSize;
                    const speed = (receivedBytes - lastBytes) / (currentTime - lastTime);
                    this.$store.commit(
                        types.APP.download_set_file,
                        [
                            { field: 'percent', value: Number((num * 100).toFixed(2)), filepath: url },
                            { field: 'speed', value: speed, filepath: url },
                            { field: 'start', value: currentTime, filepath: url },
                            { field: 'bytes', value: num * fileSize, filepath: url },
                        ],
                    );
                } else {
                    this.$store.commit(
                        types.APP.download_set_file,
                        [
                            { field: 'percent', value: Number((num * 100).toFixed(2)), filepath: url },
                        ],
                    );

                }

                if (num === 1) {
                    console.log('finish', url);
                    this.$store.commit(
                        types.APP.download_set_file,
                        { field: 'status', value: 'finish', filepath: url },
                    );
                    this.$store.dispatch(types.APP.download_a_start_upload);
                }
            });
        },
        mounted() {
            if (this.$route.query && this.$route.query.bucketname) {
                if (this.$route.query.bucketname !== this.bucket.name) {
                    this.initBucket(this.$route.query.bucketname);
                }
            }
        },
        methods: {
            initBucket(bucketname) {
                this.bucket.name = bucketname;

                if (this.privatebucket && this.privatebucket.length > 0 && this.privatebucket.indexOf(this.bucket.name) !== -1) {
                    this.bucket.isprivate = true;
                } else {
                    this.bucket.isprivate = false;
                }

                this.bucket.currentDir = '';

                this.bucket.dirs = [];
                this.bucket.files = [];
                this.bucket.marker = '';
                this.endable = false;
                if (this.bucket.name.indexOf('__app__') !== 0) {
                    this.getDomains();
                    this.bucket.dirs.push('');
                    this.bucket.dirs.push('__withoutDelimiter__');
                    this.bucket.withoutDelimiterFiles = [];
                    this.getDir();
                    this.getResources();

                    this.endable = true;
                }
            },
            getDomains() {
                this.doRequsetGet(Constants.method.getDomains, {tbl: this.bucket.name}, (response) => {
                    if (!response)
                        return;

                    this.bucket.domains = response.data;

                    if (this.bucket.domains && this.bucket.domains.length > 0) {
                        //默认选择第一个域名
                        this.bucket.domain = this.bucket.domains[0];
                    } else {
                        if (this.customedomain && this.customedomain[this.bucket.name]) {
                            this.bucket.domain = this.customedomain[this.bucket.name];
                        } else {
                            this.bucket.domain = '';
                        }
                    }
                });
            },
            /**
             * 获取该bucket下的目录
             * @param marker 上一次列举返回的位置标记，作为本次列举的起点信息。
             */
            getDir(marker) {//获取目录
                let data = {
                    bucket: this.bucket.name,
                    delimiter: '/',
                    limit: 1000
                };
                if (marker) {
                    data.marker = marker;
                }

                this.doRequset(Constants.method.getResources, data, (response) => {
                    if (!response)
                        return;

                    if (response.data.commonPrefixes) {
                        this.bucket.dirs = this.bucket.dirs.concat(response.data.commonPrefixes);
                    }

                    if (response.data.items) {//不包含公共前缀的文件列表
                        this.bucket.withoutDelimiterFiles = this.bucket.withoutDelimiterFiles.concat(response.data.items);
                    }

                    if (response.data.marker) {
                        this.getDir(response.data.marker);
                    }
                });
            },
            getResources(keyword) {
                this.bucket.selection = [];

                let data = {
                    bucket: this.bucket.name,
                    limit: 30
                };

                if (keyword) {
                    data.prefix = keyword;
                }

                if (this.bucket.marker) {
                    data.marker = this.bucket.marker;
                }

                this.doRequset(Constants.method.getResources, data, (response) => {
                    if (!response)
                        return;

                    if (this.bucket.marker) {
                        this.bucket.files = this.bucket.files.concat(response.data.items);
                    } else {
                        this.bucket.files = response.data.items;
                    }
                    if (response.data.marker) {
                        this.bucket.marker = response.data.marker;
                    } else {
                        this.bucket.marker = '';
                    }
                });
            },
            /**
             *  dir：目录
             *  search：关键字
             */
            doSearch: function (dir, search) {
                this.bucket.marker = '';
                this.getResources(search ? dir + search : dir);
            },
            /**
             * Dir 组件 搜索
             * @param search
             */
            doDirSearch: function (search) {
                this.bucket.currentDir = search;
                this.bucket.marker = '';

                if (search === '__withoutDelimiter__') {
                    this.bucket.files = this.bucket.withoutDelimiterFiles;
                } else {
                    this.doSearch(this.bucket.currentDir);
                }
            },
            removes() {
                if (this.setup_deleteNoAsk) {
                    this.doRemove();
                } else {
                    this.deleteNoAskModel = true;
                }
            },
            doRemove() {
                EventBus.$emit(Constants.Event.removes);
            },
            downloads() {
                EventBus.$emit(Constants.Event.download);
            },
            copy() {
                EventBus.$emit(Constants.Event.copy);
            },
            paste() {
                EventBus.$emit(Constants.Event.paste);
            },
            modify(index) {
                this.modifyModel = true;
                this.modifyIndex = index;
            },
            /**
             * 表单模式/图片模式
             * @param type
             */
            showType(type) {
                this.bucket.selection = [];
                this.bucket.showType = type;
            },
            onUpdate(ret, action) {
                let keyword = '';
                if (ret && ret.key) {
                    keyword = util.getPrefix(ret.key);
                    this.bucket.currentDir = keyword;
                }
                this.getResources(keyword);
            },
            doModify() {
                const modifyData = this.$refs.modifyForm;
                const baseParams = {
                    bucket: this.bucket.name,
                    key: this.bucket.files[this.modifyIndex].key,
                };
                const mimeType = modifyData.mimeModel.value;
                if (mimeType) {
                    cloudStorage.changeMime({ ...baseParams, value: mimeType }).then(resp => {
                        this.$Message.success("修改MimeType成功");
                        this.onUpdate();
                    }).catch(e => {
                        this.$Message.error("修改MimeType失败");
                    });
                }

                const customHeaders = modifyData.customModel;
                let headers = {};
                for (let key in modifyData.headerModel) {
                    const value = modifyData.headerModel[key];
                    if (value) {
                        headers[key] = value;
                    }
                }
                customHeaders.items.forEach(item => {
                    if (item.key) {
                        headers[item.key] = item.value;
                    }
                });

                if (Object.keys(headers).length > 0) {
                    cloudStorage.changeHeaders({ ...baseParams, headers }).then(() => {
                        this.$Message.success("修改Headers成功");
                        this.onUpdate();
                    }).catch(e => {
                        this.$Message.error("修改Headers失败");
                    })
                }
                this.$refs.modifyForm.resetData();
            },
            changeMime() {

            }
        }

    };
</script>