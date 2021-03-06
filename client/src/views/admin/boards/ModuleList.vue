<template>
  <section class="boards">
    <header class="underline underline-inline-block underline-animated">
      <strong>게시판 현황 및 관리</strong>
    </header>
    <div class="buttons">
      <b-button
        type="is-primary"
        size="is-small"
        tag="router-link"
        to="/gate/manager/boards/new"
      >
        <font-awesome-icon icon="pen" />&nbsp;
        <span>신규 게시판 모듈 생성</span>
      </b-button>
    </div>
    <hr>
    <b-table
      :data="boards"
      :loading="loading"
      :mobile-cards="false"
    >
      <template slot-scope="props">
        <b-table-column
          field="category_idx"
          label="ID"
          sortable
          numeric
          width="5%"
        >
          {{ props.row.category_idx }}
        </b-table-column>
        <b-table-column
          field="category_nm"
          label="모듈명"
          sortable
          width="50%"
        >
          <router-link :to="`/gate/manager/boards/${props.row.category_idx}`">
            <strong>{{ props.row.category_nm }}</strong>
          </router-link>
        </b-table-column>
        <b-table-column
          field="title"
          label="영문명"
          sortable
          width="15%"
        >
          {{ props.row.title }}
        </b-table-column>
        <b-table-column
          field="depth"
          label="Depth"
          width="5%"
        >
          {{ props.row.depth }}
        </b-table-column>
        <b-table-column
          field="settings"
          label="설정"
          width="25%"
        >
          <div class="buttons">
            <b-button
              type="is-light"
              size="is-small"
              tag="router-link"
              :to="`/gate/manager/boards/${props.row.category_idx}/edit`"
            >
              <font-awesome-icon icon="pen" />&nbsp;
              <span>수정</span>
            </b-button>
            <b-button
              type="is-danger"
              size="is-small"
              @click="removeCategory(props.row.category_nm, props.row.category_idx)"
            >
              <font-awesome-icon icon="trash" />&nbsp;
              <span>삭제</span>
            </b-button>
          </div>
        </b-table-column>
      </template>
    </b-table>
  </section>
</template>

<script>
import _ from 'lodash'
import gql from 'graphql-tag'
import { AllCates } from '@/assets/graphql/queries'
import { removeCategory, modCategory } from '@/assets/graphql/mutations'
export default {
  data () {
    return {
      boards: [],
      loading: true
    }
  },
  apollo: {
    boards: {
      query: gql`${AllCates}`,
      variables () {
        return {
          depth: 0,
          category_type: 'NORMAL'
        }
      },
      fetchPolicy: 'network-only'
    }
  },
  watch: {
    boards (value) {
      if (value) {
        this.loading = false
      }
    }
  },
  methods: {
    removeCategory (name, id) {
      this.$buefy.dialog.prompt({
        title: `'${name}' 삭제`,
        message: `게시판 <strong>${name}</strong> 모듈을 삭제하시겠습니까?<br>관련 게시물 모두 함께 삭제됩니다.<br>신중히 선택해주세요.<br>진행하시려면 <strong>확인</strong>을 입력해주세요.`,
        inputAttrs: {
          placeholder: '\'확인\'을 입력해주세요.',
          maxlength: 2
        },
        confirmText: '삭제',
        cancelText: '취소',
        type: 'is-danger',
        hasIcon: true,
        icon: 'exclamation-triangle',
        trapFocus: true,
        onConfirm: (value) => {
          if (value === '확인') {
            document.body.classList.add('loading')
            this.$apollo.mutate({
              mutation: gql`${modCategory}`,
              variables: {
                mode: 'DESTROY',
                options: {
                  category_idx: parseInt(id)
                }
              }
            }).then(({ data: { modCategory } }) => {
              if (modCategory) {
                document.body.classList.remove('loading')
                this.boards = _.remove(this.boards, (item) => (item.category_idx !== id))
                this.$buefy.toast.open(`${name} 모듈이 삭제되었습니다.`)
              }
            }).catch(error => {
              console.error(error)
            })
          } else {
            this.$buefy.toast.open('입력값 오류. 취소되었습니다.')
          }
        },
        onCancel: () => this.$buefy.toast.open('취소되었습니다.')
      })
    }
  }
}
</script>

<style>

</style>
