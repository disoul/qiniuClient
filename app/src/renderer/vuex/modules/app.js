/**
 * Created by zhangweiwei on 2017/2/28.
 */
import * as types from '../mutation-types';
import { cloudStorage } from '../../service';
import * as util from '../../util/util';
import electron from 'electron';

const storage = require('electron-json-storage');
/*function setAppSetup(key, value) {
 storage.get('app_setup', (error, app) => {
 if (!error) {
 app[key] = value;
 storage.set('app_setup', app);
 }
 })
 }*/
function setAppSetup(app) {
    storage.set('app_setup', app, () => {});
}


export default {
    state: {
        setup: {
            deleteNoAsk: false,
            copyType: 'url',
            bucket_name: '',
            bucket_dir: '',
            imagestyle: 'imageView2/1/w/100/h/100/format/webp/q/10',
            downloaddir: '',
            privatebucket: [],
            customedomain: {},
            privatedeadline: 3600//默认1小时
        },
        copy: {
            srcKeys: [],
            srcBucket: null,
        },
        app_buckets: [],
        upload: {
            file: {
                  query: [],
            },
            limit: 4,
            downloadLimit: 4,
            showPlane: false,
        },
        fs: {
            perfix: '',
            delimiter: '/',
        },
    },
    mutations: {
        [types.APP.setup_s_privatebucket](state, value) {
            state.setup.privatebucket = value;
            setAppSetup(state.setup);
        },
        [types.APP.setup_s_deadline](state, value) {
            state.setup.privatedeadline = value;
            setAppSetup(state.setup);
        },
        [types.APP.setup_s_downloaddir](state, value) {
            state.setup.downloaddir = value;
            setAppSetup(state.setup);
        },
        [types.APP.setup_s_deleteNoAsk](state, value) {
            state.setup.deleteNoAsk = value;
            setAppSetup(state.setup);
        },
        [types.APP.setup_copyType](state, value) {
            state.setup.copyType = value;
            setAppSetup(state.setup);
        },
        [types.APP.setup_s_customedomain](state, value) {
            if (!state.setup.customedomain) {
                state.setup.customedomain = {};
            }
            state.setup.customedomain = Object.assign(state.setup.customedomain, value);
            setAppSetup(state.setup);
        },
        [types.APP.setup_savedir](state, value) {
            state.setup.bucket_name = value[0];
            state.setup.bucket_dir = value[1];

            setAppSetup(state.setup);
        },
        [types.APP.setup_imagestyle](state, value) {
            state.setup.imagestyle = value;
            setAppSetup(state.setup);
        },
        [types.APP.app_buckets](state, value) {
            state.app_buckets = value;
            state.setup.privatebucket = value;
        },
        [types.APP.app_setup_init](state, value) {
            state.setup = value;
        },
        [types.APP.app_copy_set](state, { srcBucket, srcKeys }) {
            state.copy.srcBucket = srcBucket;
            state.copy.srcKeys = srcKeys;
        },
        [types.APP.upload_append_file](state, { key, bucket, path }) {
            if (state.upload.file[path]) {
                const file = state.upload.file[path];
                if (file.status !== 'finish' && file.status !== 'error') return;

                const queryIndex = state.upload.file.query.indexOf(path);
                const t = state.upload.file.query[0];
                state.upload.file.query[0] = state.upload.file.query[queryIndex];
                state.upload.file.query[queryIndex] = t;
            } else {
                state.upload.file.query.push(path);
            } 
            state.upload.file[path] = {
                key,
                // idle pending pause error finish
                status: 'idle',
                percent: 0,
                speed: -1,
                bucket,
                path,
                type: 'upload',
            };
        },
        [types.APP.download_append_file](state, { key, url, savePath, size }) {
            const uniqueUrl = url.split('?')[0];
            if (state.upload.file[uniqueUrl]) {
                const file = state.upload.file[uniqueUrl];
                if (file.status !== 'finish' && file.status !== 'error') return;
                const queryIndex = state.upload.file.query.indexOf(uniqueUrl);
                const t = state.upload.file.query[0];
                state.upload.file.query[0] = state.upload.file.query[queryIndex];
                state.upload.file.query[queryIndex] = t;
            } else {
                state.upload.file.query.push(uniqueUrl);
            }
            state.upload.file[uniqueUrl] = {
                url,
                key,
                savePath,
                size,
                status: 'idle',
                percent: 0,
                speed: -1,
                type: 'download',
            };
        },
        [types.APP.upload_set_file](state, payload) {
            let args = [];
            if (!Array.isArray(payload)) {
                args = [payload];
            } else {
                args = payload;
            }
            args.forEach(item => {
                const { filepath, field, value } = item;
                // 触发setter
                state.upload.file = { ...state.upload.file };
                state.upload.file[filepath][field] = value;
            });
        },
        [types.APP.upload_set_plane](state, value) {
            state.upload.showPlane = value == undefined ? !state.upload.showPlane : value;
        },
        [types.APP.upload_set_limit](state, { type, value }) {
            switch (type) {
                case 'download':
                    state.upload.downloadLimit = value;
                    break;
                case 'upload':
                    state.upload.limit = value;
                    break;
                default:
                    throw new Error('unsupport type');
            }
        },
    },
    actions: {
        [types.APP.qiniu_key](context, json) {
            context.commit(types.APP.qiniu_key, json);
        },
        [types.APP.setup_a_deadline](context, value) {
            context.commit(types.APP.setup_s_deadline, value);
        },
        [types.APP.setup_a_privatebucket](context, value) {
            context.commit(types.APP.setup_s_privatebucket, value);
        },
        [types.APP.setup_a_imagestyle](context, value) {
            context.commit(types.APP.setup_imagestyle, value);
        },
        [types.APP.app_a_buckets](context, value) {
            context.commit(types.APP.app_buckets, value);
        },
        [types.APP.setup_a_deleteNoAsk](context, json) {
            context.commit(types.APP.setup_s_deleteNoAsk, json);
        },
        [types.APP.setup_a_downloaddir](context, json) {
            context.commit(types.APP.setup_s_downloaddir, json);
        },
        [types.APP.setup_a_copyType](context, json) {
            context.commit(types.APP.setup_copyType, json);
        },
        [types.APP.setup_a_savedir](context, value) {
            context.commit(types.APP.setup_savedir, value);
        },
        [types.APP.setup_a_customedomain](context, value) {
            context.commit(types.APP.setup_s_customedomain, value);
        },
        [types.APP.app_a_setup_init](context) {
            storage.get('app_setup', (error, app) => {
                if (!error) {
                    if (!util.isEmptyObject(app)) {
                        context.commit(types.APP.app_setup_init, app);
                    }
                }
            });
        },
        [types.APP.upload_a_start_upload](context, path) {
            const pendingLength = context.getters.upload_status_filelist('pending').length;
            const idleList = context.getters.upload_status_filelist('idle');
            if (pendingLength >= context.state.upload.limit || idleList.length <= 0) {
                return;
            }
            const file = path ? context.state.upload.file[path] : idleList[0];

            const params = {
                bucket: file.bucket,
                key: file.key,
                path: file.path,
                progressCallback: (p, speed) => {
                    context.commit(types.APP.upload_set_file, [{
                            field: 'percent',
                            value: p,
                            filepath: file.path,
                        }, {
                            field: 'speed',
                            value: speed,
                            filepath: file.path,
                        }
                    ]);
                },
            };
            context.commit(types.APP.upload_set_file, {
                field: 'status',
                value: 'pending',
                filepath: file.path,
            });
            cloudStorage.upload(params, (err, ret) => {
                if (err) {
                    context.commit(types.APP.upload_set_file, [{
                            field: 'status',
                            value: 'error',
                            filepath: file.path,
                        }, {
                            field: 'error',
                            value: err.error || err,
                            filepath: file.path,
                        }
                    ]);
                } else {
                    context.commit(types.APP.upload_set_file, [
                        { field: 'status', value: 'finish', filepath: file.path },
                        { field: 'percent', value: 100, filepath: file.path },
                    ]);
                }
                context.dispatch(types.APP.upload_a_start_upload);
            });
        },
        [types.APP.download_a_start_upload](context, url) {
            const pendingLength = context.getters.download_status_filelist('pending').length;
            const idleList = context.getters.download_status_filelist('idle');
            if (pendingLength >= context.state.upload.downloadLimit || idleList.length <= 0) {
                return;
            }
            const file = url ? context.state.upload.file[url] : idleList[0];
            context.commit(types.APP.download_set_file, [
                { field: 'status', value: 'pending', filepath: file.url.split('?')[0] },
                { field: 'start', value: Date.now(), filepath: file.url.split('?')[0] },
            ]);
            electron.ipcRenderer.send(
                'downloadFile',
                file.url,
                { directory: file.savePath },
            );
        },
        [types.APP.upload_a_append_file](context, { path, bucket, key }) {
            context.commit(types.APP.upload_append_file, { path, bucket, key });
            context.dispatch(types.APP.upload_a_start_upload);
        },
        [types.APP.download_a_append_file](context, { key, url, savePath, size }) {
            context.commit(types.APP.download_append_file, { key, url, savePath, size });
            context.dispatch(types.APP.download_a_start_upload);
        },
        [types.APP.upload_a_set_limit](context, { type, value }) {
            switch (type) {
                case 'download':
                    context.commit(types.APP.upload_set_limit, { type, value });
                    context.dispatch(types.APP.download_a_start_upload);
                    break;
                case 'upload':
                    context.commit(types.APP.upload_set_limit, { type, value });
                    context.dispatch(types.APP.upload_a_start_upload);
                    break;
                default:
                    throw new Error('unsupport type');
            }
        },
        [types.APP.copy_a_paste](context, { bucket, callback }) {
            cloudStorage.copy({
                srcBucket: context.state.copy.srcBucket,
                srcKeys: context.state.copy.srcKeys,
                destBucket: bucket,
            }, function (e, respBody, respInfo) {
                context.commit(types.APP.app_copy_set, { srcBucket: null, srcKeys: [] });
                callback(e, respBody);
            });
        },
    },
    getters: {
        [types.APP.setup_deadline](state) {
            return ('privatedeadline' in state.setup) ? state.setup.privatedeadline : 3600;
        },
        [types.APP.setup_privatebucket](state) {
            return ('privatebucket' in state.setup) ? state.setup.privatebucket : [];
        },
        [types.APP.setup_downloaddir](state) {
            return ('downloaddir' in state.setup) ? state.setup.downloaddir : '';
        },
        [types.APP.setup_imagestyle](state) {
            return ('imagestyle' in state.setup) ? state.setup.imagestyle : 'imageView2/1/w/100/h/100/format/webp/q/10';
        },
        [types.APP.setup_deleteNoAsk](state) {
            return ('deleteNoAsk' in state.setup) ? state.setup.deleteNoAsk : false;
        },
        [types.APP.setup_copyType](state) {
            return ('copyType' in state.setup) ? state.setup.copyType : 'url';
        },
        [types.APP.setup_bucket_name](state) {
            return ('bucket_name' in state.setup) ? state.setup.bucket_name : '';
        },
        [types.APP.setup_bucket_dir](state) {
            return ('bucket_dir' in state.setup) ? state.setup.bucket_dir : '';
        },
        [types.APP.setup_customedomain](state) {
            return ('customedomain' in state.setup) ? state.setup.customedomain : {};
        },
        [types.APP.app_buckets](state) {
            return state.app_buckets;
        },
        [types.APP.upload_filelist]: (state) => (type) => {
            return state.upload.file.query.filter(path => {
                const file = state.upload.file[path];
                return file.type === type;
            }).map(path => state.upload.file[path]);
        },
        [types.APP.upload_status_filelist]: (state) => (status) => {
            return state.upload.file.query.filter(path => {
                const file = state.upload.file[path];
                return file.status === status && file.type === 'upload';
            }).map(path => state.upload.file[path]);
        },
        [types.APP.download_status_filelist]: (state) => (status) => {
            return state.upload.file.query.filter(path => {
                const file = state.upload.file[path];
                return file.status === status && file.type === 'download';
            }).map(path => state.upload.file[path]);
        },
    }
};
