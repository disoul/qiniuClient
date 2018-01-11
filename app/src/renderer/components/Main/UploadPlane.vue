<style>
.upload-plane {
  position: absolute;
  width: 600px;
  height: 500px;
  bottom: 0;
  right: 0;
  z-index: 10;
}
</style>
<template>
  <Card class="upload-plane">
    <Tabs value="upload">
      <TabPane label="上传" name="upload">
        <ul class="filelist">
          <li v-for="filepath, index in files.query" :key="filepath" class="fileitem">
            {{ filepath }}
          </li>
        </ul>
      </TabPane>
    </Tabs>
  </Card>
</template>
<script>
import { mapGetters, mapState } from 'vuex';
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
  },
  created() {
  },
}
</script>
