<style lang="css">
.subtitle {
  margin-bottom: 10px;
}
.tips {
  margin-bottom: 10px;
}
.ivu-form-item {
  margin-bottom: 15px !important;
}
</style>
<template>
<div>
  <h3 class="subtitle">修改MimeType</h3>
  <Form
    :model="mimeModel" label-position="right" label-width=120
  >
    <FormItem label="设置新的MimeType">
      <Input v-model="mimeModel.value"></Input>
    </FormItem>
  </Form>
  <h3 class="subtitle">修改Headers</h3>
  <Form
    :model="headerModel" label-position="right" label-width=100
  >
    <FormItem
      label="Content-Type"
    >
      <Input v-model="headerModel['Content-Type']" />
    </FormItem>
    <FormItem
      label="Last-Modified"
    >
      <Input v-model="headerModel['Last-Modified']" />
    </FormItem>
  </Form>
  <h3 class="subtitle">自定义Headers</h3>
  <p class="tips">您可以添加自定义headers字段，将以X-Qn-Meta-XXXX的形式存储</p>
  <Form
    :model="customModel"
    label-position="right"
  >
    <FormItem
      label="X-Qn-Meta-" label-width=100
      v-for="(item, index) in customModel.items"
      :key="index"
    >
      <Row>
        <Col span="8">
            <Input v-model="item.key" />
        </Col>
        <Col span="2" style="text-align: center;height: 33px;line-height: 33px;">:</Col>
        <Col span="14">
            <Input v-model="item.value" />
        </Col>
      </Row>
    </FormItem>
    <FormItem>
      <Row>
        <Col span="8">
          <Button type="dashed" style="margin-left: 20px;"long @click="handleAdd" icon="plus-round">添加自定义Header</Button>
        </Col>
      </Row>
    </FormItem>
  </Form>
</div>
</template>
<script>
export default {
  data: initData,
  methods: {
    handleAdd() {
      this.customModel.items.push({
        key: "",
        value: "",
      })
    },
    resetData() {
      const defaultData = initData();
      this.mimeModel = defaultData.mimeModel;
      this.headerModel = defaultData.headerModel;
      this.customModel = defaultData.customModel;
    }
  },
}

function initData() {
  return {
    mimeModel: {
      value: "",
    },
    headerModel: {
      'Content-Type': "",
      'Last-Modified': "",
    },
    customModel: {
      items: [
        {
          key: "",
          value: "",
        }
      ],
    },
  }; 
}
</script>
