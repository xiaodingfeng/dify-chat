import { DeleteOutlined, EditOutlined, MoreOutlined, TagOutlined } from '@ant-design/icons'
import { LucideIcon } from '@dify-chat/components'
import {
	AppModeLabels,
	DifyAppStore,
	IDifyAppItem,
	IDifyChatContextMultiApp,
	useDifyChat,
} from '@dify-chat/core'
import { useIsMobile } from '@dify-chat/helpers'
import { useRequest } from 'ahooks'
import { Button, Col, Dropdown, Empty, Input, message, Row, Tag } from 'antd'
import { useHistory } from 'pure-react-router'
import { useEffect, useState } from 'react'

import { AppEditDrawer } from '@/components/app-edit-drawer'
import { AppDetailDrawerModeEnum } from '@/components/app-manage-drawer'
import HeaderLayout from '@/layout/header'

export default function AppListPage() {
	const history = useHistory()
	const { appService, mode, enableSetting } = useDifyChat() as IDifyChatContextMultiApp
	const isMobile = useIsMobile()
	const [appEditDrawerOpen, setAppEditDrawerOpen] = useState(false)
	const [appEditDrawerMode, setAppEditDrawerMode] = useState<AppDetailDrawerModeEnum>()
	const [appEditDrawerAppItem, setAppEditDrawerAppItem] = useState<IDifyAppItem>()
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [searchKeyword, setSearchKeyword] = useState('')

	const { runAsync: getAppList, data: list } = useRequest(
		() => {
			return appService.getApps()
		},
		{
			manual: true,
			onError: error => {
				message.error(`获取应用列表失败: ${error}`)
				console.error(error)
			},
		},
	)
	const allTags = Array.from(new Set(list?.flatMap(app => app.info.tags || []))) || []
	const filteredList = list?.filter(app => {
		const tags = app.info.tags || []
		return (
			(selectedTags.length === 0 || selectedTags.some(tag => tags.includes(tag))) &&
			(app.info.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
				app.info.description?.toLowerCase().includes(searchKeyword.toLowerCase()))
		)
	})
	useEffect(() => {
		if (mode === 'multiApp') {
			getAppList()
		} else {
			// FIXME: 若不加定时器，URL 会更新但是页面 UI 仍然停在当前页面
			setTimeout(() => {
				history.push('/chat')
			}, 200)
		}
	}, [])

	return (
		<div className="h-screen relative overflow-hidden flex flex-col bg-theme-bg w-full">
			<HeaderLayout
				title={
					<div className="flex items-center">
						<LucideIcon
							name="layout-grid"
							size={16}
							className="mr-1"
						/>
						应用列表
					</div>
				}
			/>
			<div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 px-6 py-2 bg-white rounded-xl shadow-sm">
				{/* 标签区域 */}
				<div className="flex-1 min-w-0 overflow-x-auto py-1">
					<div className="flex flex-wrap gap-2">
						{allTags.map(tag => (
							<Tag.CheckableTag
								key={tag}
								checked={selectedTags.includes(tag)}
								onChange={checked => {
									setSelectedTags(
										checked ? [...selectedTags, tag] : selectedTags.filter(t => t !== tag),
									)
								}}
							>
								{tag}
							</Tag.CheckableTag>
						))}
					</div>
				</div>

				{/* 搜索输入框 */}
				<div className="flex-shrink-0">
					<Input
						placeholder="搜索应用名称"
						allowClear
						size="middle"
						value={searchKeyword}
						onChange={e => setSearchKeyword(e.target.value)}
						className="w-full sm:w-48 rounded-full shadow-sm"
					/>
				</div>
			</div>

			<div className="flex-1 bg-theme-main-bg rounded-3xl py-6 overflow-y-auto box-border overflow-x-hidden">
				{list?.length ? (
					<Row
						gutter={[16, 16]}
						className="px-3 md:px-6"
					>
						{filteredList.map(item => {
							const hasTags = item.info.tags?.length
							return (
								<Col
									key={item.id}
									span={isMobile ? 24 : 6}
								>
									<div
										key={item.id}
										className={`relative group p-3 bg-theme-btn-bg border border-solid border-theme-border rounded-2xl cursor-pointer hover:border-primary hover:text-primary`}
									>
										<div
											onClick={() => {
												history.push(`/app/${item.id}`)
											}}
										>
											<div className="flex items-center overflow-hidden">
												<div className="h-10 w-10 bg-[#ffead5] dark:bg-transparent border border-solid border-transparent dark:border-theme-border rounded-lg flex items-center justify-center">
													<LucideIcon
														name="bot"
														className="text-xl text-theme-text"
													/>
												</div>
												<div className="flex-1 overflow-hidden ml-3 text-theme-text h-10 flex flex-col justify-between">
													<div className="truncate font-semibold pr-4">{item.info.name}</div>
													<div className="text-theme-desc text-xs mt-0.5">
														{item.info.mode ? AppModeLabels[item.info.mode] : 'unknown'}
													</div>
												</div>
											</div>
											<div className="text-sm mt-3 h-10 overflow-hidden text-ellipsis leading-5 whitespace-normal line-clamp-2 text-theme-desc">
												{item.info.description || '暂无描述'}
											</div>
										</div>
										<div className="flex items-center text-desc truncate mt-3 h-4">
											{hasTags ? (
												<>
													<TagOutlined className="mr-2" />
													{item.info.tags.join('、')}
												</>
											) : null}
										</div>

										{/* 操作图标 */}
										{enableSetting && !appService.readonly ? (
											<Dropdown
												menu={{
													items: [
														{
															key: 'edit',
															icon: <EditOutlined />,
															label: '编辑',
															onClick: () => {
																setAppEditDrawerMode(AppDetailDrawerModeEnum.edit)
																setAppEditDrawerOpen(true)
																setAppEditDrawerAppItem(item)
															},
														},
														{
															key: 'delete',
															icon: <DeleteOutlined />,
															label: '删除',
															danger: true,
															onClick: async () => {
																await (appService as DifyAppStore).deleteApp(item.id)
																message.success('删除应用成功')
																getAppList()
															},
														},
													],
												}}
											>
												<MoreOutlined className="absolute right-3 top-3 text-lg" />
											</Dropdown>
										) : null}
									</div>
								</Col>
							)
						})}
					</Row>
				) : (
					<div className="w-full h-full box-border flex flex-col items-center justify-center px-3">
						<Empty description="暂无应用" />
					</div>
				)}
			</div>

			{enableSetting && !appService.readonly ? (
				<Button
					type="primary"
					size="large"
					className="!absolute w-4/5 md:!w-96 box-border bottom-4 left-1/2 !rounded-3xl"
					style={{
						transform: 'translateX(-50%)',
					}}
					onClick={() => {
						setAppEditDrawerMode(AppDetailDrawerModeEnum.create)
						setAppEditDrawerOpen(true)
						setAppEditDrawerAppItem(undefined)
					}}
				>
					新增应用配置
				</Button>
			) : null}

			<AppEditDrawer
				detailDrawerMode={appEditDrawerMode!}
				open={appEditDrawerOpen}
				onClose={() => setAppEditDrawerOpen(false)}
				appItem={appEditDrawerAppItem}
				confirmCallback={() => {
					getAppList()
				}}
			/>
		</div>
	)
}
