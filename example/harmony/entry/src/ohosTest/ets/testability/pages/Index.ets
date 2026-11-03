@Entry
@Component
struct Index {
  build() {
    Column() {
      Text('Running onDeviceTest...')
        .fontSize(16)
        .fontColor('#666666')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
  }
}
