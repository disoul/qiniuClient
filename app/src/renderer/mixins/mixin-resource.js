import {mapGetters} from 'vuex';
import * as types from '../vuex/mutation-types';
import * as util from '../util/util';
import {cloudStorage} from '../service/index';

export default {
    computed: {
        ...mapGetters({
            menuState: types.APP.menu_state,
            setup_copyType: types.APP.setup_copyType,
            setup_deleteNoAsk: types.APP.setup_deleteNoAsk,
            setup_imagestyle: types.APP.setup_imagestyle,
            setup_downloaddir: types.APP.setup_downloaddir,
            setup_deadline: types.APP.setup_deadline,
        })
    },
    props: {
        bucket: {
            type: Object
        },
        showModifyModel: {
            type: Function
        }
    },
    data() {
        return {
            deleteKey: '',
            deleteNoAskModel: false
        };
    },
    created: function () {
    },
    methods: {
        getResoureUrl(index, key) {
            let fileName;
            if (key) {
                fileName = key;
            } else {
                fileName = this.bucket.files[index].key;
            }
            let url;
            if (this.bucket.isprivate) {
                url = cloudStorage.getPrivateUrl(this.bucket.domain, fileName, this.setup_deadline);
            } else {
                url = util.getQiniuUrl(this.bucket.domain, fileName);
            }
            return url;
        },
        show(index) {
            this.$electron.shell.openExternal(this.getResoureUrl(index));
        },
        modify(index) {
            this.showModifyModel(index);
        },
        copy(index) {
            util.setClipboardText(this, this.setup_copyType, this.getResoureUrl(index));

            this.$Message.info('文件路径以复制到剪贴板');
            event.stopPropagation();
        },
        downloadFiles() {
            const files = this.bucket.selection;
            for (let i = 0; i < files.length; i += 1) {
                const currentFile = this.bucket.selection[i];
                const url = this.getResoureUrl(null, currentFile.key);
                this.$store.dispatch(
                    types.APP.download_a_append_file,
                    { url, savePath: this.setup_downloaddir, size: currentFile.fsize },
                );
            }
        },
        copyFiles() {
            const files = this.bucket.selection;
            const srcBucket = this.bucket.name;
            console.log(files, srcBucket);
            this.$store.commit(types.APP.app_copy_set, {
                srcKeys: files.map(f => f.key),
                srcBucket,
            });
        },
        pasteFiles() {
            this.$store.dispatch(types.APP.copy_a_paste, {
                bucket: this.bucket.name,
                callback: (e, respBody) => {
                    this.$Message.info('复制完成');
                    this.$emit('on-update');
                },
            });
        },
        removes() {
            this.deleteKey = this.bucket.selection[0].key;

            if (this.bucket.selection.length === 1) {
                this.doRemove();
            } else {
                this.doRemove(() => {
                    this.bucket.selection.shift();
                    if (this.bucket.selection.length > 0)
                        this.removes();
                });
            }
        },
        remove(index, event) {
            this.deleteKey = this.bucket.files[index].key;
            if (this.setup_deleteNoAsk) {
                this.doRemove();
            } else {
                this.deleteNoAskModel = true;
            }
            event.stopPropagation();
        },
        doRemove(callback) {
            cloudStorage.remove({
                bucket: this.bucket.name,
                key: this.deleteKey
            }, (ret) => {
                if (callback) {
                    callback();
                } else {
                    this.$Message.info('移除成功');
                    if (!ret) {
                        ret = {
                            key: this.deleteKey
                        };
                    }
                    this.$emit('on-update', ret, 'remove', event);
                }

            });
        },
    }
};