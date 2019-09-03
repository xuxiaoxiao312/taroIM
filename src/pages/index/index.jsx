import Taro, { Component } from '@tarojs/taro';
import { View, Image, Input, Text, ScrollView } from '@tarojs/components';
import { AtIcon } from 'taro-ui';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import './index.less';

export default class IM extends Component {
	constructor() {
		super(...arguments);
		this.state = {
			list: [],
			newMessageList: [],
			mediaTypes: [
				{
					type: 'camera',
					name: '拍照'
				},
				{
					type: 'album',
					name: '照片'
				}
			],
			messageContent: '',
			addMediaModal: false,
			animated: false,
			scrollHeight: '100vh',
			inputBottom: 0,
			listScrollTop: 14999
		};
		this.windowHeight = Taro.getSystemInfoSync().windowHeight;
		this.keyHeight = 0;
		this.handleMessageSubmit = debounce(this.handleMessageSubmit, 1000, {
			leading: true,
			trailing: false
		});
		this.addNewData = debounce(this.addNewData, 1000, {
			leading: true,
			trailing: true
		});
		this.newListHeight = 0;
		this.timeFun = null;
		this.moveTime = 0;
	}
	componentWillMount() {
		let list = [];
		// mock一些数据
		for (let index = 0; index < 20; index++) {
			list.unshift({
				id: index,
				userId: index % 2 ? 1 : 2,
				avatar:
					index % 2
						? 'https://cn.bing.com/th?id=OIP.OixcxS8Zgcwp7MiAXZmzCAHaFj&pid=Api&rs=1'
						: 'http://pic.zhutou.com/html/UploadPic/2010-6/2010665113407.jpg',
				content: '内容' + index,
				image: ''
			});
		}
		this.setState({
			list
		});
	}
	addNewData() {
		let newMessageList = [];
		let { list } = this.state;
		for (let index = list.length; index < list.length + 20; index++) {
			newMessageList.unshift({
				id: index,
				userId: index % 2 ? 1 : 2,
				avatar:
					index % 2
						? 'https://cn.bing.com/th?id=OIP.OixcxS8Zgcwp7MiAXZmzCAHaFj&pid=Api&rs=1'
						: 'http://pic.zhutou.com/html/UploadPic/2010-6/2010665113407.jpg',
				content: '内容' + index,
				image: ''
			});
		}
		this.setState({ newMessageList }, () => {
			const IMquery = Taro.createSelectorQuery().in(this.$scope);
			IMquery.select('#newCoversationList')
				.boundingClientRect((rect) => {
					this.newListHeight = rect.height;
				})
				.exec();
		});
	}

	onListScroll() {
		if (this.timeFun) {
			clearTimeout(this.timeFun);
			this.timeFun = null;
		}
		let vm = this;
		// 滚动结束， 合并数组
		this.timeFun = setTimeout(function() {
			vm.setState((prev) => {
				if (prev.newMessageList.length > 0 && prev.list[0].id !== prev.newMessageList[0].id) {
					console.log('滚动结束');
					vm.moveTime++;
					return {
						list: prev.newMessageList.concat(prev.list),
						listScrollTop: vm.newListHeight + vm.moveTime % 2 - 50
					};
				}
			});
		}, 300);
	}

	handleKeyboardHeightChange(e) {
		this.setInputBottom(e);
	}
	handleFocus(e) {
		this.setState({
			addMediaModal: false
		});
		this.setInputBottom(e);
	}

	setInputBottom(e) {
		let keyHeight = e.detail.height;
		let { list } = this.state;
		this.setState(
			(prev) => {
				if (keyHeight !== prev.inputBottom) {
					return {
						inputBottom: keyHeight + 'px',
						scrollHeight: `${this.windowHeight - keyHeight}px`
					};
				}
			},
			() => {
				if (list.length > 0) {
					// 添加 moveTime 是因为taro针对setstate做了优化，相同数据不做处理，不重新渲染，官方提供了forceUpdate的方法，但是此处没有作用。
					this.moveTime++;
					this.setState((prev) => {
						return {
							listScrollTop: prev.list.length * 1000 + this.moveTime
						};
					});
				}
			}
		);
	}
	handleBlur() {
		this.setState((prev) => {
			return {
				scrollHeight: prev.addMediaModal ? this.windowHeight - 122 + 'px' : '100vh',
				inputBottom: 0
			};
		});
	}
	handleInput(e) {
		this.setState({ messageContent: e.detail.value });
	}

	toggleaddMedia() {
		this.setState(
			(prev) => {
				return {
					addMediaModal: !prev.addMediaModal,
					scrollHeight: prev.addMediaModal ? '100vh' : this.windowHeight - 122 + 'px',
					animated: true
				};
			},
			() => {
				this.moveTime++;
				this.setState((prev) => {
					return {
						listScrollTop: prev.list.length * 1000 + this.moveTime
					};
				});
			}
		);
	}

	handleAddMedia(type) {
		Taro.chooseImage({
			sizeType: [ 'compressed' ],
			sourceType: [ type ],
			count: 9,
			success: (res) => {
				this.moveTime++;
				this.setState((prev) => {
					let lastItem = prev.list[prev.list.length - 1];
					let newList = Array.from(res.tempFilePaths, (item, i) => {
						return {
							id: lastItem.id + i + 1,
							avatar: 'https://cn.bing.com/th?id=OIP.OixcxS8Zgcwp7MiAXZmzCAHaFj&pid=Api&rs=1',
							userId: 1,
							image: item
						};
					});
					let list = prev.list.concat(...newList);
					return {
						list,
						listScrollTop: list.length * 1000 + this.moveTime
					};
				});
			}
		});
	}
	handleMessageSubmit(e) {
		if (e.detail.value) {
			this.moveTime++;
			this.setState((prev) => {
				let lastItem = prev.list[prev.list.length - 1];
				let list = prev.list.concat({
					id: lastItem.id + 1,
					avatar: 'https://cn.bing.com/th?id=OIP.OixcxS8Zgcwp7MiAXZmzCAHaFj&pid=Api&rs=1',
					userId: 1,
					content: e.detail.value,
					image: ''
				});
				return {
					messageContent: '',
					list,
					listScrollTop: list.length * 1000 + this.moveTime
				};
			});
		}
	}

	onImgLoad(i, e) {
		this.setState((prev) => {
			let list = prev.list;
			if (!list[i].imgWidth) {
				let width, height;
				if (e.detail.width > e.detail.height) {
					width = e.detail.width < 150 ? e.detail.width : 150;
				} else {
					height = e.detail.height < 120 ? e.detail.height : 120;
					width = e.detail.width * height / e.detail.height;
				}
				list[i].imgWidth = width;
				return { list };
			}
		});
	}
	render() {
		let {
			list,
			scrollHeight,
			inputBottom,
			messageContent,
			addMediaModal,
			mediaTypes,
			animated,
			listScrollTop,
			newMessageList
		} = this.state;
		return (
			<View className='im-page'>
				<View className='im-list_new' id='newCoversationList' onTouchMove={this.test.bind(this)}>
					{newMessageList.map((item) => {
						return (
							<View className='im-list--item' key={item.id}>
								{!!item.image ? (
									<Image src={item.image} style={{ height: '240rpx' }} />
								) : (
									<View className='list-item--content'>{item.content}</View>
								)}
								<Image className='list-item--avatar' src={item.avatar} mode='aspectFill' lazyLoad />
							</View>
						);
					})}
				</View>
				<View>
					<ScrollView
  className='im-list'
  enableFlex
  enableBackToTop
  scrollY
  style={{ height: scrollHeight }}
  scrollTop={listScrollTop}
  onScrollToUpper={this.addNewData.bind(this)}
  onScroll={this.onListScroll.bind(this)}
					>
						{list.map((item, i) => {
							return (
								<View
  key={item.id}
  className={classNames({
										'im-list--item__other': item.userId != 1,
										'im-list--item': true
									})}
								>
									{!!item.image.length ? (
										<Image
  src={item.image}
  style={{
												width: (item.imgWidth * 2 || 0) + 'rpx',
												height: '240rpx',
												opacity: item.imgWidth ? 1 : 0
											}}
  onLoad={this.onImgLoad.bind(this, i)}
  className='list-item--image'
  lazyLoad
  mode='aspectFit'
										/>
									) : (
										<View className='list-item--content'>{item.content}</View>
									)}
									<Image className='list-item--avatar' src={item.avatar} mode='aspectFill' lazyLoad />
								</View>
							);
						})}
						<View className='placeholder-box' />
					</ScrollView>
				</View>
				<View className='im-toolbar' style={{ bottom: addMediaModal ? '122px' : inputBottom }}>
					<Input
  placeholder='对 Ta 发送消息'
  placeholderStyle={{ color: '#cccccc' }}
  value={messageContent}
  confirmHold
  adjustPosition={false}
  confirmType='send'
  onKeyboardHeightChange={this.handleKeyboardHeightChange.bind(this)}
  onFocus={this.handleFocus.bind(this)}
  onBlur={this.handleBlur.bind(this)}
  onInput={this.handleInput.bind(this)}
  onConfirm={this.handleMessageSubmit.bind(this)}
					/>
					<View
  className={classNames({
							'im-toolbar--icon': true,
							'rotate-in': addMediaModal && animated,
							'rotate-out': !addMediaModal && animated
						})}
					>
						<AtIcon
  prefixClass='icon'
  value='x_line'
  color='#333333'
  size='25'
  onClick={this.toggleaddMedia.bind(this)}
						/>
					</View>
				</View>
				{addMediaModal && (
					<View className='im-toolbar--media' style='height: 122px'>
						{mediaTypes.map((item) => {
							return (
								<View key={item.type} onClick={this.handleAddMedia.bind(this, item.type)}>
									<AtIcon prefixClass='icon' value={item.type} size='30' color='#555' />
									<Text>{item.name}</Text>
								</View>
							);
						})}
					</View>
				)}
			</View>
		);
	}
}
