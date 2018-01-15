<style>
.upload-plane {
  position: absolute;
  width: 600px;
  height: 500px;
  bottom: 0;
  right: 10px;
  z-index: 10;
  overflow-y: auto;
  background: #fff;
}

.close {
  position: absolute;
  right: 20px;
  top: 8px;
  cursor: pointer;
  z-index: 10;
}

.fileitem {
  position: relative;
  height: 60px;
}

.fileitem__main {
  padding: 8px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.fileitem:hover .control-wrapper{
  opacity: 1;
  pointer-events: auto;
}

.fileitem__info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}

.fileitem__status.error {
  color: #ed3f14;
}

.fileitem__status.finish {
  color: #0f8248;
}

.control-wrapper {
  position: absolute;
  border-radius: 3px;
  transition: opacity ease 0.3s;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  opacity: 0;
  pointer-events: none;
  z-index: 11;
}
</style>
<template>
  <Card class="upload-plane">
    <div
      class="close" v-on:click="closePlane()"
    >
      <Icon
        type="ios-close-empty"
        size="40"
      ></Icon>
    </div>
    <Tabs value="upload">
      <TabPane label="上传" name="upload">
        <ul class="filelist">
          <li v-for="filepath, index in files.query" :key="filepath" class="fileitem">
            <div class="control-wrapper">

            </div>
            <div class="fileitem__main">
              <div class="fileitem__info">
                <p>{{filenames[index]}}</p>
                <p class="fileitem__status" v-bind:class="{ [files[filepath].status]: true }">
                  {{ getStatusText(files[filepath]) }}
                </p>
              </div>
              <Progress
                :stroke-width="6" class="progress" 
                :percent="files[filepath].percent"
                :status="getProgessStatus(files[filepath].status)"
              ></Progress>
            </div>
          </li>
        </ul>
      </TabPane>
    </Tabs>
  </Card>
</template>
<script>
import { mapGetters, mapState } from 'vuex';
import { getFilename, getSpeedText } from '../../util/util';
import * as types from '../../vuex/mutation-types'

export default {
  name: 'UploadPlane',

  computed: {
    // TODO: sort
    ...mapState({
      files: state => state.app.upload.file,
    }),
    ...mapGetters([
      types.APP.upload_status_filelist
    ]),
    filenames() {
      const query = this.$store.state.app.upload.file.query;
      return query.map(getFilename);
    },
  },
  methods: {
    closePlane() {
      console.log('close');
      this.$store.commit(types.APP.upload_set_plane, false);
    },
    getProgessStatus(status) {
      switch (status) {
        case 'pending':
          return 'active';
        case 'error':
          return 'wrong';
        case 'finish':
          return 'success';
        default:
          return 'normal';
      }
    },
    getStatusText(file) {
      switch (file.status) {
        case 'pending':
          return getSpeedText(file.speed);
        case 'error':
          return `传输失败`;
        case 'finish':
          return `传输成功`;
        case 'idle':
          return `等待其他任务结束`;
        default:
          return '';
      }
    }
  },
  created() {
  },
}
</script>
